import { requireClient } from '../auth.js';
import { getConfig } from '../config.js';
import { getCaller } from '../upstream/index.js';
import { log } from '../logger.js';

export async function handleTestModel(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const model = url.searchParams.get('model');
  const provider = cfg.providers.find(p => p.id === providerId);

  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };

  if (!provider) return send(404, { ok: false, error: 'Provider not found' });
  if (!model) return send(400, { ok: false, error: 'Model required' });

  const caller = getCaller(provider.type);
  if (!caller) return send(400, { ok: false, error: 'Type ' + provider.type + ' belum ada caller' });

  // Provider OAuth butuh token; provider API key butuh apiKeys
  if (provider.type === 'openai-codex' || provider.type === 'anthropic-oauth' || provider.type === 'github-copilot' || provider.type === 'google-gemini-cli') {
    if (provider.status !== 'ready') return send(400, { ok: false, error: 'Connect OAuth dulu' });
  } else {
    const keys = (provider.apiKeys || []).filter(k => !String(k).includes('GANTI_KEY') && k !== 'oauth');
    if (keys.length === 0) return send(400, { ok: false, error: 'Belum ada API key. Klik Add API Key.' });
  }

  const body = { messages: [{ role: 'user', content: 'hi' }] };
  const opts = { timeoutMs: 30000 };
  const start = Date.now();

  try {
    const result = await caller(provider, body, model, opts);
    const latency = Date.now() - start;
    log.info('test model ok', { provider: provider.id, model, latency });
    send(200, { ok: true, model, latency });
  } catch (err) {
    const latency = Date.now() - start;
    log.warn('test model fail', { provider: provider.id, model, error: err.message });
    send(200, { ok: false, model, latency, error: err.message.slice(0, 300) });
  }
}