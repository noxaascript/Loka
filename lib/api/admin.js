import { getConfig, loadConfig } from '../config.js';
import { getStats } from '../stats.js';
import { clear as clearCache } from '../cache.js';
import { cooldownSnapshot, clearCooldown } from '../scheduler.js';
import { listCombos } from '../combo.js';
import { requireClient } from '../auth.js';
import { log } from '../logger.js';
import { listBlacklisted, unblacklist, clearExpired } from '../model-health.js';

function send(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

export function handleAdmin(req, res, url) {
  requireClient(req);
  const cfg = getConfig();

  if (url.pathname === '/admin/stats') {
    return send(res, 200, { ...getStats(), cooldowns: cooldownSnapshot() });
  }
  if (url.pathname === '/admin/reload') {
    loadConfig('./loka.json');
    log.info('admin: config reloaded');
    return send(res, 200, { ok: true, reloaded: true });
  }
  if (url.pathname === '/admin/cache/clear') {
    clearCache();
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/admin/cooldown/clear') {
    for (const p of cfg.providers) clearCooldown(p.id);
    return send(res, 200, { ok: true });
  }
  if (url.pathname === '/admin/combos') {
    return send(res, 200, { combos: listCombos(), raw: cfg.combos });
  }


  if (url.pathname === '/admin/model-health' && req.method === 'GET') {
    clearExpired();
    return send(res, 200, { blacklisted: listBlacklisted() });
  }

  if (url.pathname === '/admin/model-health/clear' && req.method === 'POST') {
    clearExpired();
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: { message: 'Admin route tidak ada' } });
}
