import { randomBytes, createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const ZEN_CANDIDATES = [
  join(homedir(), '.local', 'share', 'opencode', 'auth.json'),
  join(homedir(), '.config', 'opencode', 'auth.json'),
  join(homedir(), '.local', 'state', 'opencode', 'auth.json')
];

function findZenToken(node, depth) {
  if (!node || typeof node !== 'object' || depth > 6) return null;
  for (const [k, v] of Object.entries(node)) {
    if (/zen/i.test(k)) {
      if (typeof v === 'string' && v.length > 20) return v;
      if (v && typeof v === 'object') {
        const direct = v.accessToken || v.token || v.key || v.apiKey;
        if (typeof direct === 'string' && direct.length > 20) return direct;
        const t = findZenToken(v, depth + 1);
        if (t) return t;
      }
    } else if (v && typeof v === 'object') {
      const t = findZenToken(v, depth + 1);
      if (t) return t;
    }
  }
  return null;
}

// Ambil token Zen dari auth opencode CLI (login sekali: opencode auth login --provider zen).
// Jadi nggak perlu isi api key manual di Loka.
export function getOpenCodeZenToken() {
  for (const p of ZEN_CANDIDATES) {
    try {
      if (!existsSync(p)) continue;
      const t = findZenToken(JSON.parse(readFileSync(p, 'utf8')), 0);
      if (t) return t;
    } catch {}
  }
  for (const env of ['OPENCODE_ZEN_KEY', 'ZEN_API_KEY']) {
    if (process.env[env] && process.env[env].length > 20) return process.env[env];
  }
  return null;
}

function generateSessionId(seed) {
  if (seed) {
    // ? connectionId ?????? ID????????
    const hash = createHash('sha256').update(String(seed)).digest('hex');
    return 'ses_' + hash.slice(0, 26);
  }
  // ????ses_ + 12 lowercase hex + 14 alnum
  const hex = randomBytes(6).toString('hex');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const buf = randomBytes(14);
  let alnum = '';
  for (let i = 0; i < 14; i++) alnum += chars[buf[i] % chars.length];
  return 'ses_' + hex + alnum;
}

function generateRequestId() {
  return 'msg_' + randomBytes(12).toString('hex');
}

export async function callOpenCodeZen(provider, body, model, opts) {
  const explicit = (provider.apiKeys && provider.apiKeys[0]) || 'public';
  const key = (explicit && explicit !== 'public') ? explicit : (getOpenCodeZenToken() || 'public');

  if (key === 'public') {
    const e = new Error('opencode zen belum connect: jalankan `opencode auth login --provider zen` atau isi Zen API key di /providers');
    e.status = 401;
    throw e;
  }

  const start = Date.now();

  // ? provider.id + model ?????????
  const seed = provider.id + ':' + model + ':' + (opts.sessionKey || 'default');
  const sessionId = generateSessionId(seed);
  const requestId = generateRequestId();

  const url = provider.baseUrl.replace(/\/$/, '') + '/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
      'User-Agent': 'opencode/1.18.18',
      'x-opencode-client': 'cli',
      'x-opencode-project': 'global',
      'x-opencode-session': sessionId,
      'x-opencode-request': requestId
    },
    body: JSON.stringify({ ...body, model }),
    signal: AbortSignal.timeout(opts.timeoutMs || 60000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error('HTTP ' + res.status + ': ' + errText.slice(0, 300));
  }

  const data = await res.json();
  return {
    data,
    latency: Date.now() - start,
    tokens: data.usage?.total_tokens || 0
  };
}