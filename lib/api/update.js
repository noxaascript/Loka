import { requireClient } from '../auth.js';
import { checkAll, updatePackage, getPackageFor, LOKA_PACKAGE } from '../updater.js';
import { log } from '../logger.js';

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
  catch { return {}; }
}

// GET /api/update/check
export async function handleUpdateCheck(req, res, url) {
  requireClient(req);
  try {
    const results = await checkAll();
    send(res, 200, { ok: true, results });
  } catch (err) {
    log.error('update check failed', { error: err.message });
    send(res, 500, { ok: false, error: err.message });
  }
}

// POST /api/update/proxy
export async function handleUpdateProxy(req, res, url) {
  requireClient(req);
  log.info('updating Loka proxy...');
  const result = await updatePackage(LOKA_PACKAGE, 'beta');
  if (result.ok) {
    log.info('Loka updated, restart required');
  } else {
    log.warn('Loka update failed', { error: result.error });
  }
  send(res, 200, result);
}

// POST /api/update/cli
export async function handleUpdateCli(req, res, url) {
  requireClient(req);
  const body = await readBody(req);
  const cliId = body.id;

  const info = getPackageFor(cliId);
  if (!info) {
    return send(res, 400, { ok: false, error: 'CLI tidak dikenal: ' + cliId });
  }

  log.info('updating CLI: ' + cliId + ' (' + info.pkg + ')');
  const result = await updatePackage(info.pkg);
  send(res, 200, result);
}