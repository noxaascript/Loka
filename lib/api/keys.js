import { randomBytes } from 'crypto';
import { getConfig, saveConfig } from '../config.js';
import { requireClient } from '../auth.js';

function generateKey() {
  const bytes = randomBytes(32);
  const b64 = bytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return 'sk-' + b64;
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

export async function handleKeys(req, res, url) {
  const cfg = getConfig();

  // Pastikan clients adalah array bersih
  if (!Array.isArray(cfg.clients)) cfg.clients = [];

  // ===== REGENERATE =====
  if (url.pathname === '/api/keys/regenerate' && req.method === 'POST') {
    requireClient(req);
    if (!cfg.clients.length || typeof cfg.clients[0]?.name !== 'string') {
      cfg.clients = [{ name: 'default', tier: 'unlimited' }];
    }
    cfg.clients[0].key = generateKey();
    if (typeof cfg.clients[0].tier !== 'string') cfg.clients[0].tier = 'unlimited';
    saveConfig();
    return send(res, 200, { ok: true, key: cfg.clients[0].key });
  }

  // ===== CREATE =====
  if (url.pathname === '/api/keys/create' && req.method === 'POST') {
    requireClient(req);
    const body = await readBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const tier = typeof body.tier === 'string' && body.tier.trim() ? body.tier.trim() : 'standard';

    if (!name) {
      return send(res, 400, { ok: false, error: 'Nama wajib diisi' });
    }

    // Bersihin client lama yang korup
    cfg.clients = cfg.clients.filter(c => c && typeof c.name === 'string' && typeof c.key === 'string' && c.key.startsWith('sk-'));

    if (cfg.clients.find(c => c.name === name)) {
      return send(res, 400, { ok: false, error: 'Nama sudah dipakai' });
    }

    const key = generateKey();
    cfg.clients.push({ name, key, tier });
    saveConfig();
    return send(res, 200, { ok: true, key });
  }

  // ===== DELETE =====
  if (url.pathname === '/api/keys/delete' && req.method === 'POST') {
    requireClient(req);
    const body = await readBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return send(res, 400, { ok: false, error: 'Nama wajib diisi' });
    }
    const before = cfg.clients.length;
    cfg.clients = cfg.clients.filter(c => c && c.name !== name);
    if (cfg.clients.length === before) {
      return send(res, 404, { ok: false, error: 'Key tidak ditemukan' });
    }
    saveConfig();
    return send(res, 200, { ok: true });
  }

  // ===== LIST =====
  if (url.pathname === '/api/keys/list' && req.method === 'GET') {
    requireClient(req);
    const list = cfg.clients
      .filter(c => c && typeof c.name === 'string')
      .map(c => ({ name: c.name, key: c.key, tier: typeof c.tier === 'string' ? c.tier : 'standard' }));
    return send(res, 200, { ok: true, clients: list });
  }

  return send(res, 404, { ok: false, error: 'Keys route tidak ada: ' + url.pathname });
}