import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, unlinkSync, renameSync } from 'fs';
import { dirname, basename, join } from 'path';
import { getConfig, getConfigPath } from '../config.js';
import { requireClient } from '../auth.js';
import { log } from '../logger.js';
import { listAvailableModels, pruneInvalidComboModels, isModelValid, buildModelIndex } from '../combo.js';

// Must match the path lib/config.js actually loads from (it also supports a cwd
// fallback), otherwise combo saves silently miss the real file.
function cfgPath() {
  return getConfigPath();
}

const BACKUP_KEEP = 5;

// Every combo save used to drop a timestamped copy of loka.json and never clean
// up, so the directory accumulated hundreds of them. Keep only the newest few.
function pruneBackups() {
  try {
    const file = cfgPath();
    const dir = dirname(file);
    const prefix = basename(file) + '.combos-backup';
    const stale = readdirSync(dir)
      .filter(f => f.startsWith(prefix))
      .sort()
      .slice(0, -BACKUP_KEEP);
    for (const f of stale) unlinkSync(join(dir, f));
  } catch {}
}

function backup() {
  try {
    const file = cfgPath();
    if (existsSync(file)) {
      copyFileSync(file, file + '.combos-backup-' + Date.now());
      pruneBackups();
    }
  } catch {}
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
  catch { return {}; }
}

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function saveCombos(combos) {
  const cfg = getConfig();
  cfg.combos = combos;
  const file = cfgPath();
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('config root is not an object');
  } catch (e) {
    // Never write back a stripped-down config just because the read hiccupped.
    // That is how a combo save previously nuked the whole file to {combo: ...}.
    log.error('combos save aborted: cannot read current config', { error: String(e && e.message || e) });
    throw new Error('gagal menyimpan combos: config tidak terbaca');
  }
  raw.combos = combos;
  const tmp = file + '.tmp-' + process.pid;
  writeFileSync(tmp, JSON.stringify(raw, null, 2));
  renameSync(tmp, file);
}

export async function handleCombos(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const combos = JSON.parse(JSON.stringify(cfg.combos || {}));

  if (url.pathname === '/api/combos/create' && req.method === 'POST') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    if (!name) return send(res, 400, { ok: false, error: 'Nama wajib diisi' });
    if (combos[name]) return send(res, 400, { ok: false, error: 'Combo sudah ada' });
    backup();
    combos[name] = [];
    saveCombos(combos);
    log.info('combo created', { name });
    return send(res, 200, { ok: true, combos });
  }

  if (url.pathname === '/api/combos/add' && req.method === 'POST') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const model = String(body.model || '').trim();
    if (!name) return send(res, 400, { ok: false, error: 'Nama combo wajib' });
    if (!model) return send(res, 400, { ok: false, error: 'Model wajib' });
    if (!combos[name]) combos[name] = [];
    if (combos[name].includes(model)) return send(res, 400, { ok: false, error: 'Model sudah ada di combo' });

    const index = buildModelIndex(cfg);
    if (!isModelValid(model, index)) {
      return send(res, 400, {
        ok: false,
        error: 'Model "' + model + '" tidak tersedia di provider manapun. Import model dulu atau pilih dari daftar.'
      });
    }

    backup();
    combos[name].push(model);
    saveCombos(combos);
    log.info('combo add', { name, model });
    return send(res, 200, { ok: true, combos });
  }

  if (url.pathname === '/api/combos/remove' && req.method === 'POST') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const idx = parseInt(body.idx, 10);
    if (!name) return send(res, 400, { ok: false, error: 'Nama combo wajib' });
    if (!combos[name]) return send(res, 404, { ok: false, error: 'Combo tidak ditemukan' });
    if (isNaN(idx) || idx < 0 || idx >= combos[name].length) {
      return send(res, 400, { ok: false, error: 'Index tidak valid' });
    }
    backup();
    combos[name].splice(idx, 1);
    saveCombos(combos);
    log.info('combo remove', { name, idx });
    return send(res, 200, { ok: true, combos });
  }

  if (url.pathname === '/api/combos/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    if (!name) return send(res, 400, { ok: false, error: 'Nama wajib diisi' });
    if (!combos[name]) return send(res, 404, { ok: false, error: 'Combo tidak ditemukan' });
    backup();
    delete combos[name];
    saveCombos(combos);
    log.info('combo deleted', { name });
    return send(res, 200, { ok: true, combos });
  }

  if (url.pathname === '/api/combos/rename' && req.method === 'POST') {
    const body = await readBody(req);
    const oldName = String(body.oldName || '').trim();
    const newName = String(body.newName || '').trim();
    if (!oldName || !newName) return send(res, 400, { ok: false, error: 'Nama lama & baru wajib' });
    if (!combos[oldName]) return send(res, 404, { ok: false, error: 'Combo lama tidak ditemukan' });
    if (combos[newName]) return send(res, 400, { ok: false, error: 'Nama baru sudah dipakai' });
    backup();
    combos[newName] = combos[oldName];
    delete combos[oldName];
    saveCombos(combos);
    return send(res, 200, { ok: true, combos });
  }

  if (url.pathname === '/api/combos/prune' && req.method === 'POST') {
    const prune = pruneInvalidComboModels(cfg);
    if (prune.changed > 0) {
      backup();
      saveCombos(cfg.combos);
    }
    return send(res, 200, { ok: true, changed: prune.changed, removed: prune.removed, combos: cfg.combos });
  }

  // AVAILABLE MODELS  default: cuma provider status "ready"
  if (url.pathname === '/api/combos/available-models' && req.method === 'GET') {
    const providersParam = url.searchParams.get('providers');
    const filter = providersParam
      ? providersParam.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    // Default: ready. Bisa override ?status=all
    const statusParam = url.searchParams.get('status');
    const onlyReady = statusParam !== 'all';

    const readyIds = new Set();
    for (const p of cfg.providers || []) {
      if (!onlyReady || p.status === 'ready') readyIds.add(p.id);
    }

    const models = listAvailableModels(cfg, filter)
      .filter(m => readyIds.has(m.provider));

    return send(res, 200, { ok: true, models, total: models.length, onlyReady });
  }

  if (url.pathname === '/api/combos/list' && req.method === 'GET') {
    return send(res, 200, { ok: true, combos });
  }

  return send(res, 404, { ok: false, error: 'Combos route tidak ada: ' + url.pathname });
}
