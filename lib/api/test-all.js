import { requireClient } from '../auth.js';
import { getConfig, saveConfig } from '../config.js';
import { getCaller } from '../upstream/index.js';
import { log } from '../logger.js';

const OAUTH_TYPES = [
  'openai-codex', 'anthropic-oauth', 'github-copilot', 'google-gemini-cli',
  'antigravity', 'cursor', 'qoder', 'codebuddy', 'cline', 'clinepass',
  'mimo', 'kimi', 'kilo'
];

// Batch parallel dengan concurrency limit
async function parallelLimit(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;
      try {
        results[i] = await tasks[i]();
      } catch (e) {
        results[i] = { ok: false, error: e.message };
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(limit, tasks.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

function isModelDead(msg) {
  return /\b(402|403|404)\b|insufficient|not exist|no access|deprecat|invalid model|model not found|payment required|forbidden/i.test(msg);
}

export async function handleTestAllModels(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const concurrency = parseInt(url.searchParams.get('concurrency') || '3', 10);
  const autoRemove = url.searchParams.get('autoRemove') !== 'false';
  const provider = cfg.providers.find(p => p.id === providerId);

  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };

  if (!provider) return send(404, { ok: false, error: 'Provider not found' });

  // Cek auth
  const isOAuth = OAUTH_TYPES.includes(provider.type);
  if (isOAuth) {
    if (provider.status !== 'ready') {
      return send(400, { ok: false, error: 'Connect OAuth dulu' });
    }
  } else {
    const keys = (provider.apiKeys || []).filter(k => {
      const s = String(k);
      return !s.includes('GANTI_KEY') && s !== 'oauth' && s.trim() !== '';
    });
    if (keys.length === 0) {
      return send(400, { ok: false, error: 'Belum ada API key' });
    }
  }

  const caller = getCaller(provider.type);
  if (!caller) return send(400, { ok: false, error: 'No caller for type ' + provider.type });

  const models = [...provider.models];
  const startTime = Date.now();
  log.info('test-all start', { provider: provider.id, count: models.length });

  const tasks = models.map(model => async () => {
    const t0 = Date.now();
    try {
      await caller(provider, { messages: [{ role: 'user', content: 'hi' }] }, model, { timeoutMs: 30000 });
      return {
        model,
        ok: true,
        latency: Date.now() - t0
      };
    } catch (err) {
      const msg = String(err.message || '');
      return {
        model,
        ok: false,
        latency: Date.now() - t0,
        error: msg.slice(0, 200),
        dead: isModelDead(msg)
      };
    }
  });

  const results = await parallelLimit(tasks, concurrency);

  // Auto-remove dead models
  const removed = [];
  if (autoRemove) {
    const deadModels = results.filter(r => !r.ok && r.dead).map(r => r.model);
    if (deadModels.length) {
      provider.models = provider.models.filter(m => !deadModels.includes(m));
      saveConfig();
      removed.push(...deadModels);
      log.warn('test-all auto-removed dead models', { provider: provider.id, removed });
    }
  }

  // Update provider status
  const anyOk = results.some(r => r.ok);
  if (anyOk) {
    provider.status = 'ready';
    if (!provider.connectedAt) provider.connectedAt = new Date().toISOString();
  } else {
    provider.status = 'error';
    provider.lastError = 'Semua model gagal test';
  }
  saveConfig();

  const summary = {
    total: models.length,
    ok: results.filter(r => r.ok).length,
    fail: results.filter(r => !r.ok).length,
    dead: results.filter(r => !r.ok && r.dead).length,
    removed: removed.length,
    elapsedMs: Date.now() - startTime,
    avgLatency: results.filter(r => r.ok).length
      ? Math.round(results.filter(r => r.ok).reduce((s, r) => s + r.latency, 0) / results.filter(r => r.ok).length)
      : 0
  };

  log.info('test-all done', { provider: provider.id, ...summary });

  send(200, {
    ok: true,
    provider: provider.id,
    summary,
    results,
    removed
  });
}