import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, hostname, platform, arch } from 'os';

const AUTH_HOST = 'https://auth.kimi.com';
const CLIENT_ID = '17e5f671-d194-4dfb-9706-5516cb48c098';
const DEVICE_ID_FILE = join(homedir(), '.config', 'loka', 'kimi-device.json');

function ensureDir() {
  const dir = dirname(DEVICE_ID_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function getDeviceId() {
  ensureDir();
  if (existsSync(DEVICE_ID_FILE)) {
    try {
      const d = JSON.parse(readFileSync(DEVICE_ID_FILE, 'utf8'));
      if (d.id) return d.id;
    } catch {}
  }
  const id = randomUUID();
  writeFileSync(DEVICE_ID_FILE, JSON.stringify({ id, createdAt: new Date().toISOString() }));
  return id;
}

function kimiHeaders() {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Msh-Platform': 'loka',
    'X-Msh-Version': '0.1.0',
    'X-Msh-Device-Name': hostname() || 'loka',
    'X-Msh-Device-Model': platform() + '-' + arch(),
    'X-Msh-Os-Version': platform(),
    'X-Msh-Device-Id': getDeviceId()
  };
}

export async function start() {
  const r = await fetch(AUTH_HOST + '/api/oauth/device_authorization', {
    method: 'POST',
    headers: kimiHeaders(),
    body: new URLSearchParams({ client_id: CLIENT_ID })
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Device HTTP ' + r.status + ': ' + text.slice(0, 300));

  const data = JSON.parse(text);
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || data.verification_uri_complete || 'https://kimi.com/code/authorize_device',
    interval: data.interval || 5,
    expiresIn: data.expires_in || 600
  };
}

export async function poll(deviceCode) {
  const params = new URLSearchParams();
  params.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
  params.set('client_id', CLIENT_ID);
  params.set('device_code', deviceCode);

  const r = await fetch(AUTH_HOST + '/api/oauth/token', {
    method: 'POST',
    headers: kimiHeaders(),
    body: params.toString()
  });

  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON: ' + text.slice(0, 200)); }

  if (data.error === 'authorization_pending') return { status: 'pending' };
  if (data.error === 'slow_down') return { status: 'slow_down' };
  if (data.error) throw new Error(data.error_description || data.error);

  return {
    status: 'success',
    token: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    }
  };
}