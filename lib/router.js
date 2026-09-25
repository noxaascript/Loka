import { getCaller, getStreamer } from './upstream/index.js';
import { recordSuccess, recordFailure, inCooldown } from './scheduler.js';
import { bumpProvider } from './stats.js';
import { withRetry } from './retry.js';
import { log } from './logger.js';
import { compressMessages } from './tools/rtk.js';
import { compactHistory } from './tools/compactor.js';
import { isFallbackEligible } from './errors.js';
import { isBlacklisted, blacklist } from './model-health.js';
import { expandCombo, comboName } from './combo.js';
import { sseHead, sseSend, sseDone } from './stream.js';

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

  // 1. Combo
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

  // 2. Route biasa
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

function buildError(plan, providers, requestedModel) {
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

  if (requestedModel) {
    lines.push('');
    lines.push('Requested model: ' + requestedModel);
  }

  return lines.join('\n');
}

export async function routeChat(providers, body, cfg) {
  let messages = body.messages || [];
  if (cfg.rtk?.enabled) messages = compressMessages(messages, cfg.rtk);
  messages = compactHistory(messages);

  const processed = { ...body, messages };
  const plan = buildPlan(providers, body.model);
  const attempts = [];
  const opts = { timeoutMs: cfg.requestTimeoutMs || 60000 };

  if (!plan.length) {
    const err = new Error('No matching provider untuk model "' + (body.model || '(default)') + '". Cek combo atau connect provider dulu.');
    err.attempts = [];
    throw err;
  }

  for (const { provider, model } of plan) {
    if (isBlacklisted(provider.id, model)) {
      attempts.push({ provider: provider.id, model, error: 'Model blacklisted (skip)', fallback: true });
      log.warn('model blacklisted, skip', { provider: provider.id, model });
      continue;
    }
    // Skip provider yang belum ready  tapi kasih alasan yang jelas
    if (provider.status !== 'ready') {
      attempts.push({
        provider: provider.id,
        model,
        error: 'Provider belum connected (status: ' + provider.status + ')',
        fallback: true
      });
      log.warn('provider not ready, skip', { provider: provider.id, status: provider.status });
      continue;
    }

    const caller = getCaller(provider.type);
    if (!caller) {
      attempts.push({ provider: provider.id, model, error: 'type ' + provider.type + ' not supported', fallback: false });
      continue;
    }

    try {
      const result = await withRetry(
        () => caller(provider, processed, model, opts),
        { retries: cfg.maxRetries || 1 }
      );

      recordSuccess(provider.id);
      bumpProvider(provider.id, {
        success: true,
        latency: result.latency,
        tokens: result.tokens
      });
      log.info('route ok', { provider: provider.id, model, tokens: result.tokens });

      return {
        ...result.data,
        _loka: {
          provider: provider.id,
          model,
          chain: attempts,
          rtk: cfg.rtk?.enabled ? 'on' : 'off'
        }
      };
    } catch (err) {
      const fallback = isFallbackEligible(err);
      recordFailure(provider.id);
      bumpProvider(provider.id, { success: false, error: err.message });
      attempts.push({ provider: provider.id, model, error: err.message, fallback });

      // Auto-blacklist kalau error payment / access / model not found
      const msg = String(err.message || '');
      if (/\b(402|403|404|insufficient|not exist|no access|unauthorized|payment)/i.test(msg)) {
        blacklist(provider.id, model, msg);
        log.warn('model auto-blacklisted', { provider: provider.id, model });
      }

      log.warn('route fail', { provider: provider.id, model, error: err.message, fallback });
      continue;
    }
  }

  const err = new Error(buildError(plan, providers, body.model));
  err.attempts = attempts;
  throw err;
}

export async function routeChatStream(providers, body, cfg, res) {
  let messages = body.messages || [];
  if (cfg.rtk?.enabled) messages = compressMessages(messages, cfg.rtk);

  const processed = { ...body, messages, stream: true };
  const plan = buildPlan(providers, body.model);
  const opts = { timeoutMs: cfg.requestTimeoutMs || 60000 };
  const attempts = [];

  if (!plan.length) {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      error: { message: 'No matching provider untuk model "' + (body.model || '(default)') + '". Cek combo atau connect provider dulu.' }
    }));
  }

  for (const { provider, model } of plan) {
    if (provider.status !== 'ready') {
      attempts.push({
        provider: provider.id,
        model,
        error: 'Provider belum connected (status: ' + provider.status + ')'
      });
      log.warn('provider not ready, skip', { provider: provider.id, status: provider.status });
      continue;
    }

    const streamer = getStreamer(provider.type);
    if (!streamer) {
      attempts.push({ provider: provider.id, error: 'streaming not supported' });
      continue;
    }

    try {
      const stream = await streamer(provider, processed, model, opts);
      recordSuccess(provider.id);
      bumpProvider(provider.id, { success: true });
      log.info('stream ok', { provider: provider.id, model });

      sseHead(res);
      sseSend(res, {
        id: 'chatcmpl-' + Date.now(),
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
        _loka: { provider: provider.id, model }
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
      const fallback = isFallbackEligible(err);
      recordFailure(provider.id);
      attempts.push({ provider: provider.id, model, error: err.message, fallback });
      log.warn('stream fail', { provider: provider.id, model, error: err.message });
      continue;
    }
  }

  res.writeHead(503, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({
    error: {
      message: buildError(plan, providers, body.model),
      attempts
    }
  }));
}