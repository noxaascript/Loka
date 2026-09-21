import { requireClient } from '../auth.js';
import { getConfig } from '../config.js';
import { detectCLIs } from '../cli-detect.js';
import { writeConfig, resetConfig } from '../cli-config.js';
import { networkInterfaces } from 'os';
import { log } from '../logger.js';

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function getEndpoints(cfg) {
  const ips = [];
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ iface: name, ip: net.address });
      }
    }
  }
  const port = cfg.port;
  return [
    { id: 'local', label: 'Local', url: 'http://localhost:' + port },
    ...ips.map(i => ({ id: 'lan-' + i.iface, label: 'LAN (' + i.iface + ')', url: 'http://' + i.ip + ':' + port }))
  ];
}

export function handleCLIDetect(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const clis = detectCLIs();
  const endpoints = getEndpoints(cfg);

  // Model + combo list
  const models = [];
  for (const p of cfg.providers) {
    for (const m of p.models) {
      models.push({ id: p.id + '/' + m, provider: p.id, model: m, status: p.status });
    }
  }
  const combos = Object.keys(cfg.combos || {}).map(name => ({ id: name, models: cfg.combos[name] }));

  send(res, 200, { ok: true, clis, endpoints, models, combos });
}

export async function handleCLIConfigure(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const body = await readBody(req);
  const cliId = body.id;
  const clis = detectCLIs();
  const cli = clis.find(c => c.id === cliId);

  if (!cli) return send(res, 404, { ok: false, error: 'CLI tidak ditemukan' });
  if (!cli.installed) return send(res, 400, { ok: false, error: 'CLI belum terinstall' });

  const endpoints = getEndpoints(cfg);
  const endpoint = endpoints.find(e => e.id === body.endpoint) || endpoints[0];
  const apiKey = cfg.clients?.[0]?.key || '';

  const baseUrl = endpoint.url;
  const model = body.model || null;
  const combo = body.combo || null;

  try {
    const result = writeConfig(cli, { baseUrl, apiKey, model, combo });
    log.info('cli configured', { id: cliId, endpoint: endpoint.id, model, combo });
    send(res, 200, { ok: true, ...result, endpoint: endpoint.url, model, combo });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}

export async function handleCLIReset(req, res, url) {
  requireClient(req);
  const body = await readBody(req);
  const clis = detectCLIs();
  const cli = clis.find(c => c.id === body.id);
  if (!cli) return send(res, 404, { ok: false, error: 'CLI tidak ditemukan' });
  try {
    const result = resetConfig(cli);
    send(res, 200, { ok: true, ...result });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}