import { getConfig } from './config.js';

export function identifyClient(req) {
  const auth = req.headers['authorization'] || '';
  const key = auth.replace(/^Bearer\s+/i, '').trim();
  if (!key) return null;
  const cfg = getConfig();
  if (typeof key !== 'string' || !key) return null;
  return cfg.clients.find(c => 
    c && typeof c.name === 'string' && typeof c.key === 'string' && c.key === key
  ) || null;
}

export function requireClient(req) {
  const client = identifyClient(req);
  if (!client) {
    const err = new Error('API key tidak valid');
    err.status = 401;
    throw err;
  }
  return client;
}
