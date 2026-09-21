import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const AUTH_DIR = join(homedir(), '.config', 'loka', 'auth');

function ensure() {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });
}

export function saveToken(providerId, token) {
  ensure();
  const file = join(AUTH_DIR, `${providerId}.json`);
  writeFileSync(file, JSON.stringify({
    ...token,
    savedAt: new Date().toISOString()
  }, null, 2), { mode: 0o600 });
}

export function loadToken(providerId) {
  ensure();
  const file = join(AUTH_DIR, `${providerId}.json`);
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf-8')); }
  catch { return null; }
}

export function deleteToken(providerId) {
  ensure();
  const file = join(AUTH_DIR, `${providerId}.json`);
  try { unlinkSync(file); } catch {}
}

export function listTokens() {
  ensure();
  return readdirSync(AUTH_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}
