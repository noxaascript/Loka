import { readFileSync, writeFileSync } from 'fs';
import { getConfig } from '../config.js';
import { requireClient } from '../auth.js';

function saveCombos(combos) {
  const cfg = getConfig();
  cfg.combos = combos;
  const raw = JSON.parse(readFileSync('./loka.json', 'utf-8'));
  raw.combos = combos;
  writeFileSync('./loka.json', JSON.stringify(raw, null, 2));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

export async function handleCombos(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const combos = JSON.parse(JSON.stringify(cfg.combos || {}));

  const send = (code, data) => {
    res.writeHead(code, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
  };

  if (url.pathname === '/api/combos/create' && req.method === 'POST') {
    const { name } = await readBody(req);
    if (!name) return send(400, { ok: false, error: 'Name required' });
    combos[name] = combos[name] || [];
    saveCombos(combos);
    return send(200, { ok: true });
  }

  if (url.pathname === '/api/combos/add' && req.method === 'POST') {
    const { name, model } = await readBody(req);
    if (!name || !model) return send(400, { ok: false, error: 'Name and model required' });
    if (!combos[name]) combos[name] = [];
    combos[name].push(model);
    saveCombos(combos);
    return send(200, { ok: true });
  }

  if (url.pathname === '/api/combos/remove' && req.method === 'POST') {
    const { name, idx } = await readBody(req);
    if (combos[name]) combos[name].splice(idx, 1);
    saveCombos(combos);
    return send(200, { ok: true });
  }

  if (url.pathname === '/api/combos/delete' && req.method === 'POST') {
    const { name } = await readBody(req);
    delete combos[name];
    saveCombos(combos);
    return send(200, { ok: true });
  }

  send(404, { error: 'Combos route not found' });
}
