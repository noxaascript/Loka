import { getCaller, getStreamer } from './upstream/index.js';
import { recordSuccess, recordFailure, inCooldown } from './scheduler.js';
import { bumpProvider } from './stats.js';
import { withRetry } from './retry.js';
import { log } from './logger.js';
import { compressMessages } from './tools/rtk.js';
import { compactHistory } from './tools/compactor.js';
import { isFallbackEligible } from './errors.js';
import { expandCombo } from './combo.js';
import { sseHead, sseSend, sseDone } from './stream.js';

export function planRoute(providers, requestedModel) {
  const usable = providers.filter(p => p.status === 'ready');
  const sorted = [...usable].sort((a, b) => a.weight - b.weight);

  if (requestedModel) {
    const [pid, ...rest] = requestedModel.split('/');
    const m = rest.join('/');
    const exact = sorted.find(p => p.id === pid && p.models.includes(m));
    if (exact) return [exact, ...sorted.filter(p => p.id !== exact.id)];
  }

  const ready = sorted.filter(p => !inCooldown(p.id));
  const cooling = sorted.filter(p => inCooldown(p.id));
  return [...ready, ...cooling];
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
  const combo = expandCombo(requestedModel);
  if (combo) {
    const plan = [];
    for (const entry of combo) {
      const [pid, ...rest] = entry.split('/');
      const model = rest.join('/');
      const provider = providers.find(p => p.id === pid && p.status === 'ready');
      if (provider) plan.push({ provider, model });
    }
    if (plan.length) return plan;
  }

  return planRoute(providers, requestedModel).map(provider => ({
    provider,
    model: pickModel(provider, requestedModel)
  }));
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
    const err = new Error('No ready providers. Connect a provider first from the Providers page.');
    err.attempts = [];
    throw err;
  }

  for (const { provider, model } of plan) {
    const caller = getCaller(provider.type);
    if (!caller) {
      attempts.push({ provider: provider.id, error: `type ${provider.type} not supported` });
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
      log.warn('route fail', { provider: provider.id, error: err.message, fallback });

      // JANGAN throw  selalu lanjut ke provider berikutnya
      // Kalau perlu, coba model lain di provider yang sama
      if (!fallback) {
        log.warn('fatal error, trying next provider', { provider: provider.id });
        continue;
      }
    }
  }

  const err = new Error('All providers failed');
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
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: { message: 'No ready providers. Connect one first.' }
    }));
  }

  for (const { provider, model } of plan) {
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
      attempts.push({ provider: provider.id, error: err.message, fallback });
      log.warn('stream fail', { provider: provider.id, error: err.message });
      continue;
    }
  }

  res.writeHead(503, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ error: { message: 'Streaming failed', attempts } }));
}