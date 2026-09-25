import { requireClient } from '../auth.js';
import { getConfig, saveConfig } from '../config.js';
import { getCaller } from '../upstream/index.js';
import { log } from '../logger.js';

export async function handleTestModel(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const model = url.searchParams.get('model');
  const autoRemove = url.searchParams.get('autoRemove') !== 'false';
  const provider = cfg.providers.find(p => p.id === providerId);

  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };

  if (!provider) return send(404, { ok: false, error: 'Provider not found' });
  if (!model) return send(400, { ok: false, error: 'Model required' });

  const caller = getCaller(provider.type);
  if (!caller) return send(400, { ok: false, error: 'Type ' + provider.type + ' belum ada caller' });

  // Cek API key atau OAuth
  const oauthTypes = ['openai-codex', 'anthropic-oauth', 'github-copilot', 'google-gemini-cli', 'antigravity', 'cursor', 'qoder', 'codebuddy', 'cline', 'clinepass', 'mimo', 'kimi', 'kilo'];
  if (oauthTypes.includes(provider.type)) {
    if (provider.status !== 'ready') return send(400, { ok: false, error: 'Connect OAuth dulu' });
  } else {
    const keys = (provider.apiKeys || []).filter(k => {
      const s = String(k);
      return !s.includes('GANTI_KEY') && s !== 'oauth' && s !== 'public' && s.trim() !== '';
    });
    if (keys.length === 0 && !(provider.apiKeys || []).includes('public')) {
      return send(400, { ok: false, error: 'Belum ada API key. Klik Add API Key.' });
    }
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
    const msg = String(err.message || '');
    log.warn('test model fail', { provider: provider.id, model, error: msg });

    // Cek apakah model ini "merah"  error yang menandakan model nggak bisa dipakai
    const isModelDead = /\b(402|403|404)\b|insufficient|not exist|no access|deprecat|invalid model|model not found|payment required|forbidden/i.test(msg);

    let removed = false;
    if (isModelDead && autoRemove) {
      try {
        const idx = provider.models.indexOf(model);
        if (idx >= 0) {
          provider.models.splice(idx, 1);
          saveConfig();
          removed = true;
          log.warn('model auto-removed', { provider: provider.id, model, reason: msg.slice(0, 100) });
        }
      } catch (e) {
        log.error('auto-remove failed', { error: e.message });
      }
    }

    send(200, {
      ok: false,
      model,
      latency,
      error: msg.slice(0, 300),
      removed,
      reason: isModelDead ? 'model_dead' : 'transient'
    });
  }
}