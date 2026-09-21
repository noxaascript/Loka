import { requireClient } from '../auth.js';
import { getConfig } from '../config.js';
import { expandCombo, comboName, listCombos } from '../combo.js';

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data, null, 2));
}

export function handleDebugRoute(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const model = url.searchParams.get('model') || '';

  const combos = listCombos();
  const matched = model ? expandCombo(model) : null;

  const providers = cfg.providers.map(p => ({
    id: p.id,
    type: p.type,
    status: p.status,
    weight: p.weight,
    models: p.models.slice(0, 3)
  }));

  send(res, 200, {
    requestedModel: model,
    normalizedModel: comboName(model),
    allCombos: combos,
    comboMatched: matched,
    comboMatchedName: matched ? comboName(model) : null,
    providers,
    readyCount: cfg.providers.filter(p => p.status === 'ready').length
  });
}