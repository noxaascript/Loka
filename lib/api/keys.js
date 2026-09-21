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
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

export async function handleKeys(req, res, url) {
  const cfg = getConfig();
  const send = (code, data) => {
    res.writeHead(code, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
  };

  if (url.pathname === '/api/keys/regenerate' && req.method === 'POST') {
    requireClient(req);
    if (!cfg.clients.length) cfg.clients = [{ name: 'default', tier: 'unlimited' }];
    cfg.clients[0].key = generateKey();
    saveConfig();
    return send(200, { ok: true, key: cfg.clients[0].key });
  }

  if (url.pathname === '/api/keys/create' && req.method === 'POST') {
    requireClient(req);
    const { name, tier } = await readBody(req);
    if (!name) return send(400, { ok: false, error: 'Name required' });
    if (cfg.clients.find(c => c.name === name)) {
      return send(400, { ok: false, error: 'Name already exists' });
    }
    const key = generateKey();
    cfg.clients.push({ name, key, tier: tier || 'standard' });
    saveConfig();
    return send(200, { ok: true, key });
  }

  if (url.pathname === '/api/keys/delete' && req.method === 'POST') {
    requireClient(req);
    const { name } = await readBody(req);
    cfg.clients = cfg.clients.filter(c => c.name !== name);
    saveConfig();
    return send(200, { ok: true });
  }

  send(404, { error: 'Keys route not found' });
}
