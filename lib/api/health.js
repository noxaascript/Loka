import { getConfig } from '../config.js';
import { getStats } from '../stats.js';
import { cooldownSnapshot } from '../scheduler.js';
import { listCombos } from '../combo.js';

export function handleHealth(req, res) {
  const cfg = getConfig();
  const stats = getStats();
  const cooldowns = cooldownSnapshot();

  const providers = cfg.providers.map(p => {
    const s = stats.providers[p.id] || { success: 0, fail: 0, tokens: 0 };
    return {
      id: p.id,
      type: p.type,
      tags: p.tags || [],
      models: p.models,
      success: s.success,
      fail: s.fail,
      cooldown: cooldowns[p.id] || 0,
      lastUsed: s.lastUsed || null,
      lastError: s.lastError || null
    };
  });

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({
    ok: true,
    uptime: Math.round(process.uptime()),
    providers,
    combos: listCombos(),
    totals: stats.totals
  }));
}
