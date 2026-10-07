import { getCaller, getStreamer } from './upstream/index.js';
import { recordSuccess, recordFailure, inCooldown } from './scheduler.js';
import { bumpProvider } from './stats.js';
import { log } from './logger.js';
import { compressMessages } from './tools/rtk.js';
import { compactHistory, summarizeResult, buildSummaryMessage } from './tools/compactor.js';
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

function shouldBlacklist(err, provider) {
  const msg = String(err && err.message || '');
  // Jangan blacklist provider yang cuma butuh cred: user mungkin connect/isi key kapan aja
  if (/free.?tier|can only be used from within|not available.*tier/i.test(msg)) return false;
  const placeholderOnly = (provider && provider.apiKeys || []).every(k => k === 'public' || k === 'anonymous' || k.includes('GANTI'));
  if (placeholderOnly) return false;
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
if (shouldBlacklist(err, provider)) {
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

// ===== Server-side token saver (selalu jalan di tiap request) =====
// 1. Kompres tool output (git diff/grep/ls/json) kalau cfg.rtk.enabled
// 2. Kompak history panjang: head + middle (digest) + recent (utuh)
// 3. Opsional: ringkas middle pakai provider ready (fitur AI summarize)
function saverMeta(cfg) {
  return {
    compressor: cfg.rtk?.enabled ? 'on' : 'off',
    compactHistory: cfg.rtk ? cfg.rtk.compactHistory !== false : true,
    summarizer: cfg.rtk?.summarizeOld ? 'on' : 'off'
  };
}

async function summarizeMiddle(middle, cfg) {
  if (!middle || !middle.length) return null;
  const plan = planRoute(cfg.providers, null);
  const target = plan.find(p => p.status === 'ready');
  const caller = target && getCaller(target.type);
  if (!target || !caller) return null;

  const transcript = middle.map(m => {
    let text = '';
    if (typeof m.content === 'string') text = m.content;
    else if (Array.isArray(m.content)) {
      text = m.content.filter(c => c && c.type === 'text').map(c => c.text).join(' ');
    }
    return '[' + (m.role || '?') + '] ' + text;
  }).join('\n---\n');

  const summaryBody = {
    messages: [
      {
        role: 'system',
        content: 'You are a context compressor. Summarize the conversation transcript below into a dense 1-2 paragraph recap. Preserve facts, decisions, file paths, and key code details. Output only the recap, no preamble.'
      },
      { role: 'user', content: transcript.slice(0, 16000) }
    ]
  };

  try {
    const r = await caller(target, summaryBody, target.models[0], { timeoutMs: 20000 });
    const text = r && r.data && r.data.choices && r.data.choices[0] && r.data.choices[0].message && r.data.choices[0].message.content;
    if (typeof text !== 'string' || !text.trim()) return null;
    return text.trim();
  } catch (e) {
    log.warn('token-saver summary failed, fallback digest', { provider: target.id, error: e.message });
    return null;
  }
}

async function applyTokenSaver(messages, cfg) {
  const meta = { ...saverMeta(cfg), mode: 'none', savedTokens: 0, savedPercent: 0 };

  if (cfg.rtk?.enabled) messages = compressMessages(messages, cfg.rtk);

  if (meta.compactHistory && Array.isArray(messages) && messages.length) {
    const res = compactHistory(messages, {
      keepRecent: cfg.rtk?.keepRecent ?? 8,
      maxTokensEst: cfg.rtk?.maxTokensEst ?? 8000,
      maxChars: cfg.rtk?.maxChars ?? 160
    });

    if (res.mode === 'digest' && meta.summarizer === 'on' && res.middle && res.middle.length) {
      const summary = await summarizeMiddle(res.middle, cfg);
      if (summary) {
        const rounded = summarizeResult(res.inputTokens, [...res.head, buildSummaryMessage(res.middle, summary), ...res.recent]);
        res.messages = rounded.messages;
        res.savedTokens = rounded.savedTokens;
        res.ratio = rounded.ratio;
        res.mode = 'summary';
      }
    }

    meta.mode = res.mode;
    meta.savedTokens = res.savedTokens;
    meta.savedPercent = Math.round(res.ratio * 100);
    messages = res.messages;
  }

  return { messages, meta };
}

export async function routeChat(providers, body, cfg) {
  const { messages: savedMessages, meta: saver } = await applyTokenSaver(body.messages || [], cfg);

  const processed = { ...body, messages: savedMessages };
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
      rtk: cfg.rtk?.enabled ? 'on' : 'off',
      tokensSaved: saver.savedTokens,
      savedPercent: saver.savedPercent
    }
  };
}

// Streaming: retry kalau connect gagal, fallback kalau streamer error sebelum byte pertama
export async function routeChatStream(providers, body, cfg, res) {
  const { messages: savedMessages, meta: saver } = await applyTokenSaver(body.messages || [], cfg);

  const processed = { ...body, messages: savedMessages, stream: true };
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
          _loka: {
            provider: provider.id,
            model,
            attempts,
            tokensSaved: saver.savedTokens,
            savedPercent: saver.savedPercent
          }
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
