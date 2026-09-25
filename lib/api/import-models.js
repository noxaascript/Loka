import { requireClient } from '../auth.js';
import { getConfig, saveConfig } from '../config.js';
import { nextKey } from '../scheduler.js';
import { pruneInvalidComboModels } from '../combo.js';
import { log } from '../logger.js';

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

export async function handleImportModels(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === providerId);

  if (!provider) return send(res, 404, { ok: false, error: 'Provider tidak ditemukan' });

  const key = nextKey(provider);
  if (!key) return send(res, 400, { ok: false, error: 'Provider tidak punya API key' });

  let modelsUrl, headers;
  if (provider.type === 'gemini') {
    modelsUrl = provider.baseUrl + '/models?key=' + key;
    headers = {};
  } else {
    modelsUrl = provider.baseUrl.replace(/\/$/, '') + '/models';
    headers = { 'Authorization': 'Bearer ' + key };
  }

  try {
    log.info('import models', { provider: provider.id, url: modelsUrl });
    const r = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(15000) });
    const text = await r.text();

    if (!r.ok) {
      return send(res, 200, { ok: false, error: 'HTTP ' + r.status + ': ' + text.slice(0, 200) });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return send(res, 200, { ok: false, error: 'Response bukan JSON: ' + text.slice(0, 100) }); }

    let list = [];
    if (Array.isArray(data.data)) {
      list = data.data.map(m => m.id).filter(Boolean);
    } else if (Array.isArray(data.models)) {
      list = data.models.map(m => (m.id || m.name || '').replace(/^models\//, '')).filter(Boolean);
    } else if (Array.isArray(data)) {
      list = data.map(m => typeof m === 'string' ? m : (m.id || m.name || '')).filter(Boolean);
    }

    if (!list.length) return send(res, 200, { ok: false, error: 'Tidak ada model di response' });

    list.sort();

    const before = (provider.models || []).length;
    provider.models = list;
    saveConfig();

    // Prune combo  buang model yang gak valid setelah update
    const prune = pruneInvalidComboModels(cfg);
    if (prune.changed > 0) {
      // cfg reference sudah dimodifikasi oleh prune
      const cfgFile = JSON.parse(require('fs').readFileSync('./loka.json', 'utf8'));
      cfgFile.combos = cfg.combos;
      cfgFile.providers = cfg.providers;
      require('fs').writeFileSync('./loka.json', JSON.stringify(cfgFile, null, 2));
      log.info('combos pruned after import', { changed: prune.changed, removed: prune.removed });
    }

    log.info('models imported', { provider: provider.id, count: list.length, pruned: prune.changed });
    send(res, 200, {
      ok: true,
      count: list.length,
      before,
      models: list.slice(0, 20),
      total: list.length,
      combosPruned: prune.changed,
      combosRemoved: prune.removed
    });
  } catch (err) {
    log.warn('import models failed', { provider: provider.id, error: err.message });
    send(res, 200, { ok: false, error: err.message });
  }
}
