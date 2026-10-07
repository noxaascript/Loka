import { listBugs, getBug, setStatus, deleteBug, clearAll, getStats } from './store.js';
import { runDiagnostics } from './diagnostics.js';
import { analyzeLib } from './analyzer.js';
import { toMarkdown, sendWebhook, draftIssue } from './reporter.js';
import { getBughuntConfig } from './config-store.js';

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return {}; }
}

export function isDevRequest(req, url) {
  const c = getBughuntConfig();
  const key = c.devKey;
  if (!key) return false;
  const h = req.headers['x-dev-key'] || req.headers['x-loka-dev'];
  if (h && h === key) return true;
  if (url && url.searchParams.get('k') === key) return true;
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ') && auth.slice(7) === key) return true;
  return false;
}

export function matchRoute(path, base) {
  if (path === base || path === base + '/') return { name: 'ui' };
  if (path === base + '/api/bugs') return { name: 'list' };
  if (path === base + '/api/stats') return { name: 'stats' };
  if (path === base + '/api/diag') return { name: 'diag' };
  if (path === base + '/api/analyze') return { name: 'analyze' };
  if (path === base + '/api/clear') return { name: 'clear' };
  const mBug = path.match(new RegExp('^' + base + '/api/bugs/([a-f0-9]{8,32})$'));
  if (mBug) return { name: 'bug', fp: mBug[1] };
  const mRep = path.match(new RegExp('^' + base + '/api/bugs/([a-f0-9]{8,32})/report$'));
  if (mRep) return { name: 'report', fp: mRep[1] };
  const mWh = path.match(new RegExp('^' + base + '/api/bugs/([a-f0-9]{8,32})/webhook$'));
  if (mWh) return { name: 'webhook', fp: mWh[1] };
  const mIssue = path.match(new RegExp('^' + base + '/api/bugs/([a-f0-9]{8,32})/draft-issue$'));
  if (mIssue) return { name: 'draft', fp: mIssue[1] };
  return null;
}

export async function handle(req, res, url, route) {
  const c = getBughuntConfig();
  try {
    if (route.name === 'list' && req.method === 'GET') return json(res, 200, { ok: true, bugs: listBugs() });
    if (route.name === 'stats' && req.method === 'GET') return json(res, 200, { ok: true, stats: getStats() });
    if (route.name === 'diag' && req.method === 'GET') return json(res, 200, { ok: true, diag: await runDiagnostics() });
    if (route.name === 'analyze' && req.method === 'GET') return json(res, 200, { ok: true, findings: analyzeLib() });
    if (route.name === 'clear' && req.method === 'POST') { clearAll(); return json(res, 200, { ok: true }); }

    if (route.name === 'bug' && req.method === 'GET') {
      const b = getBug(route.fp);
      if (!b) return json(res, 404, { ok: false, error: 'not found' });
      return json(res, 200, { ok: true, bug: b });
    }
    if (route.name === 'bug' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.status) return json(res, 400, { ok: false, error: 'no action' });
      if (!setStatus(route.fp, body.status)) {
        return json(res, 400, { ok: false, error: 'status tidak valid atau bug tidak ada' });
      }
      return json(res, 200, { ok: true });
    }
    if (route.name === 'bug' && req.method === 'DELETE') {
      return json(res, 200, { ok: deleteBug(route.fp) });
    }
    if (route.name === 'report' && req.method === 'GET') {
      const b = getBug(route.fp);
      if (!b) return json(res, 404, { ok: false, error: 'not found' });
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
      return res.end(toMarkdown(b));
    }
    if (route.name === 'webhook' && req.method === 'POST') {
      const b = getBug(route.fp);
      if (!b) return json(res, 404, { ok: false, error: 'not found' });
      const wh = c.webhookUrl || '';
      if (!wh) return json(res, 400, { ok: false, error: 'no webhookUrl di data/bughunt.json' });
      return json(res, 200, { ok: true, result: await sendWebhook(wh, b) });
    }
    if (route.name === 'draft' && req.method === 'GET') {
      const b = getBug(route.fp);
      if (!b) return json(res, 404, { ok: false, error: 'not found' });
      return json(res, 200, { ok: true, draft: draftIssue(b) });
    }
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
  return json(res, 405, { ok: false, error: 'method not allowed' });
}
