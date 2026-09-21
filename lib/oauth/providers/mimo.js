import { randomBytes, createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, hostname, platform, arch } from 'os';
import { cpus } from 'os';

const BOOTSTRAP_URL = 'https://api.xiaomimimo.com/api/free-ai/bootstrap';
const DEVICE_ID_FILE = join(homedir(), '.config', 'loka', 'mimo-device.json');

function ensureDir() {
  const dir = dirname(DEVICE_ID_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function getOrCreateDeviceId() {
  ensureDir();
  if (existsSync(DEVICE_ID_FILE)) {
    try {
      const data = JSON.parse(readFileSync(DEVICE_ID_FILE, 'utf8'));
      if (data.client) return data;
    } catch {}
  }
  const cpuInfo = cpus()[0]?.model || 'unknown';
  const fingerprint = [hostname(), platform(), arch(), cpuInfo]
    .join('|')
    .slice(0, 200);
  const client = createHash('sha256').update(fingerprint + randomBytes(8).toString('hex')).digest('hex').slice(0, 32);
  const data = { client, createdAt: new Date().toISOString() };
  writeFileSync(DEVICE_ID_FILE, JSON.stringify(data, null, 2));
  return data;
}

export async function start() {
  const device = getOrCreateDeviceId();

  const r = await fetch(BOOTSTRAP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client: device.client })
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Bootstrap HTTP ' + r.status + ': ' + text.slice(0, 300));

  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON: ' + text.slice(0, 200)); }

  const jwt = data.jwt || data.token || (data.data && data.data.jwt);

  if (!jwt) throw new Error('Bootstrap response tidak ada JWT: ' + text.slice(0, 300));

  return {
    deviceCode: 'mimo-' + Date.now(),
    userCode: null,
    verificationUri: 'https://mimo.xiaomi.com/code',
    interval: 0,
    expiresIn: 0,
    _instant: true,
    _token: jwt
  };
}

export async function poll(deviceCode, userCode, session) {
  if (session && session._token) {
    return {
      status: 'success',
      token: {
        accessToken: session._token,
        refreshToken: null,
        expiresAt: Date.now() + 24 * 3600 * 1000
      }
    };
  }
  return { status: 'pending' };
}