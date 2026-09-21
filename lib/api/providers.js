import { getConfig, saveConfig } from '../config.js';
import { requireClient } from '../auth.js';
import { nextKey } from '../scheduler.js';
import { supportsOAuth, loadToken } from '../oauth/index.js';
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

  // Kalau ada token OAuth, langsung ready
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
  saveConfig();
  log.info('provider disconnected', { id: provider.id });
  send(200, { ok: true, status: 'pending' });
}
