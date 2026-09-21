import { getConfig } from '../config.js';
import { listCombos } from '../combo.js';

export function handleModels(req, res) {
  const cfg = getConfig();
  const data = [];

  for (const p of cfg.providers) {
    for (const m of p.models) {
      data.push({
        id: `${p.id}/${m}`,
        object: 'model',
        owned_by: p.id,
        tags: p.tags || []
      });
    }
  }

  for (const c of listCombos()) {
    data.push({
      id: c,
      object: 'model',
      owned_by: 'loka',
      type: 'combo'
    });
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ object: 'list', data }));
}
