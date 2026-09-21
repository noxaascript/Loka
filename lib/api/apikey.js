import { requireClient } from '../auth.js';
import { getConfig, saveConfig } from '../config.js';
import { getCaller } from '../upstream/index.js';
import { log } from '../logger.js';

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function maskKey(k) {
  const s = String(k);
  if (s.length < 12) return s.slice(0, 4) + '...';
  return s.slice(0, 8) + '...' + s.slice(-4);
}

export async function handleAddApiKey(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const body = await readBody(req);
  const provider = cfg.providers.find(p => p.id === body.providerId);

  if (!provider) return send(res, 404, { ok: false, error: 'Provider tidak ditemukan' });
  if (!body.key || !String(body.key).trim()) return send(res, 400, { ok: false, error: 'API key kosong' });

  if (!Array.isArray(provider.apiKeys)) provider.apiKeys = [];
  provider.apiKeys = provider.apiKeys.filter(k => {
    const s = String(k);
    return !s.includes('GANTI_KEY') && s !== 'oauth' && s.trim() !== '';
  });
  provider.apiKeys.push(String(body.key).trim());
  delete provider.lastError;

  // Auto-test connection pakai key baru
  const caller = getCaller(provider.type);
  let testResult = { ok: false, error: 'No caller for type ' + provider.type };

  if (caller) {
    const testBody = { messages: [{ role: 'user', content: 'hi' }] };
    const opts = { timeoutMs: 15000 };
    const model = provider.models[0];
    try {
      await caller(provider, testBody, model, opts);
      testResult = { ok: true, latency: 0 };
      provider.status = 'ready';
      provider.connectedAt = new Date().toISOString();
      log.info('api key connected', { provider: provider.id, count: provider.apiKeys.length });
    } catch (err) {
      testResult = { ok: false, error: err.message.slice(0, 200) };
      provider.status = 'error';
      provider.lastError = err.message.slice(0, 200);
      log.warn('api key connect failed', { provider: provider.id, error: err.message });
    }
  }

  saveConfig();
  send(res, 200, {
    ok: true,
    count: provider.apiKeys.length,
    keyMasked: maskKey(body.key),
    test: testResult,
    status: provider.status
  });
}

export async function handleRemoveApiKey(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const body = await readBody(req);
  const provider = cfg.providers.find(p => p.id === body.providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider tidak ditemukan' });
  if (!Array.isArray(provider.apiKeys)) provider.apiKeys = [];
  provider.apiKeys.splice(body.index, 1);
  if (provider.apiKeys.length === 0) provider.status = 'pending';
  saveConfig();
  send(res, 200, { ok: true, count: provider.apiKeys.length });
}