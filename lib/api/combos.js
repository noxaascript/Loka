import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { getConfig } from '../config.js';
import { requireClient } from '../auth.js';
import { log } from '../logger.js';

const CFG_PATH = './loka.json';

function backup() {
  try {
    if (existsSync(CFG_PATH)) {
      copyFileSync(CFG_PATH, CFG_PATH + '.combos-backup');
    }
  } catch {}
}

function saveCombos(combos) {
  const cfg = getConfig();
  cfg.combos = combos;

  // Baca file fresh dari disk biar nggak overwrite field lain
  let raw = {};
  try { raw = JSON.parse(readFileSync(CFG_PATH, 'utf8')); } catch {}
  raw.combos = combos;
  writeFileSync(CFG_PATH, JSON.stringify(raw, null, 2));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
    return {};
  }
}

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

export async function handleCombos(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  // Deep clone biar nggak mutate object reference langsung
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
    if (!name) return send(res, 400, { ok: false, error: 'Nama combo wajib diisi' });
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

  if (url.pathname === '/api/combos/list' && req.method === 'GET') {
    return send(res, 200, { ok: true, combos });
  }

  return send(res, 404, { ok: false, error: 'Combos route tidak ada: ' + url.pathname });
}