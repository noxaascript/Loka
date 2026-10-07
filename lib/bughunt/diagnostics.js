import { getConfig } from '../config.js';
import { nextKey } from '../scheduler.js';
import { existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { totalmem, freemem } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const DATA_DIR = join(ROOT, 'data');

function dirSize(dir) {
  let total = 0;
  try {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      try {
        const s = statSync(p);
        if (s.isDirectory()) total += dirSize(p);
        else total += s.size;
      } catch {}
    }
  } catch {}
  return total;
}

async function testProvider(p) {
  const t0 = Date.now();
  try {
    const key = nextKey(p);
    if (!key) return { ok: false, reason: 'no_key' };
    let url, headers;
    if (p.type === 'gemini') {
      url = p.baseUrl + '/models?key=' + key;
      headers = {};
    } else {
      url = p.baseUrl.replace(/\/$/, '') + '/models';
      headers = { Authorization: 'Bearer ' + key };
    }
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    return { ok: r.ok, status: r.status, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, reason: e.message, latencyMs: Date.now() - t0 };
  }
}

export async function runDiagnostics() {
  const cfg = getConfig();
  const mem = process.memoryUsage();
  const out = {
    at: Date.now(),
    runtime: {
      uptimeSec: Math.round(process.uptime()),
      node: process.version,
      platform: process.platform + '/' + process.arch,
      memoryMB: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
      },
      sysMemGB: {
        total: Math.round(totalmem() / 1024 / 1024 / 1024),
        free: Math.round(freemem() / 1024 / 1024 / 1024)
      }
    },
    disk: { dataDirMB: Math.round(dirSize(DATA_DIR) / 1024 / 1024) },
    providers: []
  };

  for (const p of cfg.providers || []) {
    if (p.status !== 'ready') {
      out.providers.push({ id: p.id, status: p.status, ok: false, reason: 'not_ready' });
      continue;
    }
    const r = await testProvider(p);
    out.providers.push({ id: p.id, status: p.status, ...r });
  }
  return out;
}
