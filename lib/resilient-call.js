import { classifyError, backoffMs, summarizeError, extractStatus, extractRetryAfter } from './retry-policy.js';
import { judgeResponse } from './judge.js';
import { nextKeySpread } from './spread.js';
import { log } from './logger.js';

/**
 * resilientCall
 * @param {Array} chain - [{ provider, model, caller? }]  urut sesuai prioritas
 * @param {Object} body - request body (OpenAI shape)
 * @param {Object} cfg  - loka config
 * @param {Object} opts - { spread?: bool, judge?: bool, onAttempt?: fn, signal?: AbortSignal }
 * @returns { result, provider, model, attempts, judge, spreadKeyIndex }
 */
export async function resilientCall(chain, body, cfg, opts = {}) {
  const maxRetries = Math.max(0, cfg.maxRetries ?? 2);
  const useSpread = opts.spread !== false && cfg.spread !== false;
  const useJudge = opts.judge !== false;
  const attempts = [];
  const errors = [];

  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];
    const provider = step.provider;

    // Pilih key sesuai spread
    let apiKey = step.apiKey || null;
    if (!apiKey && useSpread) apiKey = nextKeySpread(provider);

    const caller = step.caller || step._caller;
    if (!caller) {
      errors.push({ provider: provider.id, model: step.model, reason: 'no_caller' });
      continue;
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      const t0 = Date.now();
      try {
        const result = await caller(provider, body, step.model, {
          timeoutMs: cfg.requestTimeoutMs,
          apiKeyOverride: apiKey,
          signal: opts.signal,
        });

        const latency = Date.now() - t0;

        // Judge
        let verdict = { ok: true, reason: 'skipped', score: 1 };
        if (useJudge) verdict = judgeResponse(result);

        attempts.push({
          provider: provider.id,
          model: step.model,
          status: 200,
          attempt: attempt + 1,
          latencyMs: latency,
          judge: verdict.reason,
        });

        // Kalau judge bilang BAD dan masih ada provider lain  coba fallback
        if (!verdict.ok && verdict.score < 0.5 && i < chain.length - 1) {
          errors.push({
            provider: provider.id,
            model: step.model,
            status: 200,
            reason: 'judge:' + verdict.reason,
          });
          log.warn('judge rejected response, falling back', {
            provider: provider.id,
            model: step.model,
            reason: verdict.reason,
          });
          break; // keluar dari while, lanjut ke provider berikutnya
        }

        // OK
        log.info('call success', {
          provider: provider.id,
          model: step.model,
          latencyMs: latency,
          attempts: attempt + 1,
          judge: verdict.reason,
        });

        return {
          result,
          provider: provider.id,
          model: step.model,
          attempts,
          judge: verdict,
          keyIndex: apiKey ? 1 : 0,
        };
      } catch (err) {
        const status = extractStatus(err);
        const kind = classifyError(err);
        const latency = Date.now() - t0;

        attempts.push({
          provider: provider.id,
          model: step.model,
          status: status || 'err',
          attempt: attempt + 1,
          latencyMs: latency,
          kind,
          error: summarizeError(err),
        });

        if (kind === 'retry' && attempt < maxRetries) {
          const wait = backoffMs(attempt, extractRetryAfter(err));
          log.warn('retryable error, backing off', {
            provider: provider.id,
            model: step.model,
            status,
            attempt: attempt + 1,
            waitMs: wait,
          });
          opts.onAttempt?.({ provider: provider.id, attempt, status, kind, wait });
          await new Promise(r => setTimeout(r, wait));
          attempt++;
          continue;
        }

        if (kind === 'fatal') {
          log.error('fatal error, abort chain', { provider: provider.id, status, error: err.message });
          const e = new Error(summarizeError(err));
          e.status = status || 400;
          e.attempts = attempts;
          throw e;
        }

        // fallback  keluar dari while, coba provider berikutnya
        errors.push({
          provider: provider.id,
          model: step.model,
          status,
          reason: summarizeError(err),
        });
        log.warn('fallback to next provider', {
          provider: provider.id,
          model: step.model,
          status,
          kind,
        });
        break;
      }
    }
  }

  // Semua gagal
  const detail = errors.map(e => e.provider + '/' + e.model + '  ' + (e.reason || 'failed')).join(' | ');
  const e = new Error('Semua provider di chain gagal. ' + detail);
  e.status = 502;
  e.attempts = attempts;
  e.errors = errors;
  throw e;
}
