import { getConfig, saveConfig } from '../config.js';
import { requireClient } from '../auth.js';
import { nextKey } from '../scheduler.js';
import { supportsOAuth, loadToken } from '../oauth/index.js';
import { removeModelFromAllCombos } from '../combo.js';
import { log } from '../logger.js';

async function testAPIKey(provider) {
  const key = nextKey(provider);
  let testUrl, headers, method = 'GET', body = null;

  if (provider.type === 'gemini') {
    testUrl = `${provider.baseUrl}/models?key=${key}`;
    headers = {};
  } else if (provider.type === 'anthropic') {
    testUrl = `${provider.baseUrl}/messages`;
    method = 'POST';
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    };
    body = JSON.stringify({
      model: provider.models[0],
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }]
    });
  } else {
    testUrl = `${provider.baseUrl}/models`;
    headers = { 'Authorization': `Bearer ${key}` };
  }

  const r = await fetch(testUrl, {
    method, headers, body,
    signal: AbortSignal.timeout(10000)
  });

  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return true;
}

export async function handleTestProvider(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const id = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === id);
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };
  if (!provider) return send(404, { ok: false, error: 'Provider not found' });

  const start = Date.now();
  try {
    await testAPIKey(provider);
    send(200, { ok: true, latency: Date.now() - start });
  } catch (err) {
    send(200, { ok: false, latency: Date.now() - start, error: err.message });
  }
}

export async function handleConnectProvider(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const id = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === id);
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };
  if (!provider) return send(404, { ok: false, error: 'Provider not found' });

  if (supportsOAuth(provider.type)) {
    const token = loadToken(provider.id);
    if (token) {
      provider.status = 'ready';
      provider.connectedAt = new Date().toISOString();
      provider.oauthType = provider.type;
      saveConfig();
      log.info('provider connected via existing oauth token', { id: provider.id });
      return send(200, { ok: true, status: 'ready', via: 'oauth' });
    }
  }

  const start = Date.now();
  try {
    await testAPIKey(provider);
    provider.status = 'ready';
    provider.connectedAt = new Date().toISOString();
    saveConfig();
    log.info('provider connected via api key', { id: provider.id });
    send(200, { ok: true, status: 'ready', latency: Date.now() - start, via: 'apikey' });
  } catch (err) {
    provider.status = 'error';
    provider.lastError = err.message;
    saveConfig();
    log.warn('provider connect failed', { id: provider.id, error: err.message });
    send(200, { ok: false, status: 'error', error: err.message });
  }
}

export async function handleDisconnectProvider(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const id = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === id);
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };
  if (!provider) return send(404, { ok: false, error: 'Provider not found' });

  provider.status = 'pending';
  provider.connectedAt = null;
  provider.lastError = null;
  delete provider.oauthType;

  // Setelah disconnect, provider tidak bisa dipakai  prune model dari semua combo
  let combosChanged = 0;
  const combosRemoved = [];
  for (const model of provider.models || []) {
    const r = removeModelFromAllCombos(cfg, provider.id, model);
    combosChanged += r.changed;
    combosRemoved.push(...r.removed);
  }

  saveConfig();

  if (combosChanged > 0) {
    log.info('combos pruned after disconnect', {
      id: provider.id,
      combosChanged,
      removed: combosRemoved
    });
  }
  log.info('provider disconnected', { id: provider.id, combosChanged });

  send(res, 200, {
    ok: true,
    status: 'pending',
    combosChanged,
    combosRemoved
  });
}

// Endpoint tambahan: hapus model spesifik dari provider + prune combo
// POST /api/providers/remove-model?id=xxx  body: { model: "gpt-4" }
export async function handleRemoveModel(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const id = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === id);
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };
  if (!provider) return send(404, { ok: false, error: 'Provider not found' });

  const chunks = [];
  for await (const c of req) chunks.push(c);
  let body = {};
  try { body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch {}
  const model = String(body.model || '').trim();
  if (!model) return send(400, { ok: false, error: 'Field "model" wajib' });

  const before = (provider.models || []).length;
  provider.models = (provider.models || []).filter(m => m !== model);
  if (provider.models.length === before) {
    return send(404, { ok: false, error: 'Model tidak ada di provider ini' });
  }

  const r = removeModelFromAllCombos(cfg, provider.id, model);
  saveConfig();

  log.info('model removed from provider', {
    provider: provider.id,
    model,
    combosChanged: r.changed
  });

  send(res, 200, {
    ok: true,
    remaining: provider.models.length,
    combosChanged: r.changed,
    combosRemoved: r.removed
  });
}
