import { getCaller, getStreamer } from './upstream/index.js';
import { recordSuccess, recordFailure, inCooldown } from './scheduler.js';
import { bumpProvider } from './stats.js';
import { log } from './logger.js';
import { compressMessages } from './tools/rtk.js';
import { compactHistory } from './tools/compactor.js';
import { isBlacklisted, blacklist } from './model-health.js';
import { expandCombo, comboName } from './combo.js';
import { sseHead, sseSend, sseDone } from './stream.js';
import { classifyError, backoffMs, summarizeError, extractStatus, extractRetryAfter } from './retry-policy.js';
import { judgeResponse } from './judge.js';

export function planRoute(providers, requestedModel) {
  const sorted = [...providers].sort((a, b) => a.weight - b.weight);

  if (requestedModel) {
    const [pid, ...rest] = requestedModel.split('/');
    const m = rest.join('/');
    const exact = sorted.find(p => p.id === pid && p.models.includes(m));
    if (exact) return [exact, ...sorted.filter(p => p.id !== exact.id)];
  }

  const ready = sorted.filter(p => p.status === 'ready' && !inCooldown(p.id));
  const notReady = sorted.filter(p => p.status !== 'ready');
  const cooling = sorted.filter(p => p.status === 'ready' && inCooldown(p.id));
  return [...ready, ...cooling, ...notReady];
}

function pickModel(provider, requested) {
  if (requested) {
    const [pid, ...rest] = requested.split('/');
    const m = rest.join('/');
    if (pid === provider.id && provider.models.includes(m)) return m;
    if (!pid.includes('/') && provider.models.includes(requested)) return requested;
  }
  return provider.models[0];
}

function buildPlan(providers, requestedModel) {
  const plan = [];
  const seen = new Set();

  if (requestedModel) {
    const chain = expandCombo(requestedModel);
    if (chain) {
      log.info('combo matched', { combo: comboName(requestedModel), length: chain.length });
      for (const entry of chain) {
        const [pid, ...rest] = entry.split('/');
        const model = rest.join('/');
        const provider = providers.find(p => p.id === pid);
        if (!provider) {
          log.warn('combo provider not found', { entry, pid });
          continue;
        }
        const key = provider.id + '::' + model;
        if (!seen.has(key)) {
          seen.add(key);
          plan.push({ provider, model, fromCombo: true });
        }
      }
      if (plan.length) return plan;
      log.warn('combo all providers missing', { combo: comboName(requestedModel) });
    }
  }

  const routed = planRoute(providers, requestedModel);
  for (const provider of routed) {
    const model = pickModel(provider, requestedModel);
    const key = provider.id + '::' + model;
    if (!seen.has(key)) {
      seen.add(key);
      plan.push({ provider, model });
    }
  }

  return plan;
}

function buildError(plan, providers, requestedModel, attempts) {
  const readyCount = providers.filter(p => p.status === 'ready').length;
  const lines = [];

  if (readyCount === 0) {
    lines.push('Tidak ada provider yang ready.');
    lines.push('Buka /providers dan connect minimal satu provider.');
  } else {
    lines.push('Semua provider di chain gagal:');
  }

  for (const item of plan) {
    const st = item.provider.status || 'pending';
    lines.push('  - ' + item.provider.id + ' (' + st + ') : ' + item.model);
  }

  if (attempts && attempts.length) {
    lines.push('');
    lines.push('Attempts:');
    for (const a of attempts) {
      lines.push('  [' + a.provider + '/' + a.model + '] ' + (a.status || '') + ' ' + (a.error || a.reason || ''));
    }
  }

  if (requestedModel) {
    lines.push('');
    lines.push('Requested model: ' + requestedModel);
  }

  return lines.join('\n');
}

function shouldBlacklist(err) {
  const msg = String(err && err.message || '');
  return /\b(402|403|404|insufficient|not exist|no access|unauthorized|payment)\b/i.test(msg);
}

// Panggil caller dengan retry + fallback antar plan entry
async function callWithResilience(plan, processed, cfg, opts) {
  const attempts = [];
  const maxRetries = Math.max(0, cfg.maxRetries ?? 2);
  const useJudge = cfg.judge !== false;

  for (let i = 0; i < plan.length; i++) {
    const { provider, model } = plan[i];

    if (isBlacklisted(provider.id, model)) {
      attempts.push({ provider: provider.id, model, error: 'blacklisted', fallback: true });
      log.warn('model blacklisted, skip', { provider: provider.id, model });
      continue;
    }
    if (provider.status !== 'ready') {
      attempts.push({
        provider: provider.id,
        model,
        error: 'not connected (' + provider.status + ')',
        fallback: true
      });
      continue;
    }

    const caller = getCaller(provider.type);
    if (!caller) {
      attempts.push({ provider: provider.id, model, error: 'type ' + provider.type + ' unsupported', fallback: false });
      continue;
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      const t0 = Date.now();
      try {
        const result = await caller(provider, processed, model, opts);
        const latency = Date.now() - t0;

        // Judge kualitas
        let verdict = { ok: true, reason: 'skipped', score: 1 };
        if (useJudge) {
          verdict = judgeResponse(result.data || result);
        }

        attempts.push({
          provider: provider.id,
          model,
          status: 200,
          attempt: attempt + 1,
          latencyMs: latency,
          judge: verdict.reason
        });

        // Judge BAD + masih ada provider lain  fallback
        if (!verdict.ok && verdict.score < 0.5 && i < plan.length - 1) {
          log.warn('judge rejected, fallback', { provider: provider.id, model, reason: verdict.reason });
          recordFailure(provider.id);
          attempts[attempts.length - 1].fallback = true;
          break;
        }

        recordSuccess(provider.id);
        bumpProvider(provider.id, {
          success: true,
          latency: result.latency || latency,
          tokens: result.tokens
        });
        log.info('route ok', {
          provider: provider.id,
          model,
          tokens: result.tokens,
          judge: verdict.reason,
          attempt: attempt + 1
        });

        return {
          data: result.data,
          provider: provider.id,
          model,
          attempts,
          judge: verdict
        };
      } catch (err) {
        const status = extractStatus(err);
        const kind = classifyError(err);
        const latency = Date.now() - t0;

        attempts.push({
          provider: provider.id,
          model,
          status: status || 'err',
          attempt: attempt + 1,
          latencyMs: latency,
          kind,
          error: summarizeError(err),
          fallback: kind !== 'retry'
        });

        if (kind === 'retry' && attempt < maxRetries) {
          const wait = backoffMs(attempt, extractRetryAfter(err));
          log.warn('retryable, backoff', {
            provider: provider.id, model, status, attempt: attempt + 1, waitMs: wait
          });
          await new Promise(r => setTimeout(r, wait));
          attempt++;
          continue;
        }

        if (kind === 'fatal') {
          log.error('fatal, abort chain', { provider: provider.id, status, error: err.message });
          recordFailure(provider.id);
          const e = new Error(summarizeError(err));
          e.status = status || 400;
          e.attempts = attempts;
          throw e;
        }

        // fallback  provider berikutnya
        recordFailure(provider.id);
        bumpProvider(provider.id, { success: false, error: err.message });
        if (shouldBlacklist(err)) {
          blacklist(provider.id, model, err.message);
          log.warn('auto-blacklisted', { provider: provider.id, model });
        }
        log.warn('fallback to next', { provider: provider.id, model, status, kind });
        break;
      }
    }
  }

  const e = new Error(buildError(plan, [], null, attempts));
  e.status = 502;
  e.attempts = attempts;
  throw e;
}

export async function routeChat(providers, body, cfg) {
  let messages = body.messages || [];
  if (cfg.rtk?.enabled) messages = compressMessages(messages, cfg.rtk);
  messages = compactHistory(messages);

  const processed = { ...body, messages };
  const plan = buildPlan(providers, body.model);
  const opts = { timeoutMs: cfg.requestTimeoutMs || 60000 };

  if (!plan.length) {
    const err = new Error('No matching provider untuk model "' + (body.model || '(default)') + '". Cek combo atau connect provider dulu.');
    err.attempts = [];
    throw err;
  }

  const { data, provider, model, attempts, judge } = await callWithResilience(plan, processed, cfg, opts);

  return {
    ...data,
    _loka: {
      provider,
      model,
      chain: attempts,
      judge: judge.reason,
      rtk: cfg.rtk?.enabled ? 'on' : 'off'
    }
  };
}

// Streaming: retry kalau connect gagal, fallback kalau streamer error sebelum byte pertama
export async function routeChatStream(providers, body, cfg, res) {
  let messages = body.messages || [];
  if (cfg.rtk?.enabled) messages = compressMessages(messages, cfg.rtk);

  const processed = { ...body, messages, stream: true };
  const plan = buildPlan(providers, body.model);
  const opts = { timeoutMs: cfg.requestTimeoutMs || 60000 };
  const attempts = [];
  const maxRetries = Math.max(0, cfg.maxRetries ?? 2);

  if (!plan.length) {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      error: { message: 'No matching provider untuk model "' + (body.model || '(default)') + '". Cek combo atau connect provider dulu.' }
    }));
  }

  for (const { provider, model } of plan) {
    if (provider.status !== 'ready') {
      attempts.push({
        provider: provider.id, model,
        error: 'not connected (' + provider.status + ')'
      });
      continue;
    }

    const streamer = getStreamer(provider.type);
    if (!streamer) {
      attempts.push({ provider: provider.id, model, error: 'streaming unsupported' });
      continue;
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const stream = await streamer(provider, processed, model, opts);
        recordSuccess(provider.id);
        bumpProvider(provider.id, { success: true });
        log.info('stream ok', { provider: provider.id, model, attempt: attempt + 1 });

        sseHead(res);
        sseSend(res, {
          id: 'chatcmpl-' + Date.now(),
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
          _loka: { provider: provider.id, model, attempts }
        });

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value));
        }
        sseDone(res);
        return;
      } catch (err) {
        const status = extractStatus(err);
        const kind = classifyError(err);
        attempts.push({
          provider: provider.id, model,
          status: status || 'err', attempt: attempt + 1,
          kind, error: summarizeError(err),
          fallback: kind !== 'retry'
        });

        if (kind === 'retry' && attempt < maxRetries) {
          const wait = backoffMs(attempt, extractRetryAfter(err));
          log.warn('stream retry', { provider: provider.id, model, status, waitMs: wait });
          await new Promise(r => setTimeout(r, wait));
          attempt++;
          continue;
        }
        if (kind === 'fatal') {
          recordFailure(provider.id);
          return res.end(JSON.stringify({
            error: { message: summarizeError(err), attempts }
          }));
        }
        recordFailure(provider.id);
        log.warn('stream fallback', { provider: provider.id, model, status, kind });
        break;
      }
    }
  }

  if (!res.headersSent) {
    res.writeHead(503, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
  }
  res.end(JSON.stringify({
    error: {
      message: buildError(plan, providers, body.model, attempts),
      attempts
    }
  }));
}
