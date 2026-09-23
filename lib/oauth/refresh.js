import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const AUTH_DIR = join(homedir(), '.config', 'loka', 'auth');

function loadRaw(providerId) {
  const f = join(AUTH_DIR, providerId + '.json');
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; }
}

function saveRaw(providerId, token) {
  const f = join(AUTH_DIR, providerId + '.json');
  writeFileSync(f, JSON.stringify(token, null, 2), { mode: 0o600 });
}

// Refresh token untuk Google (Gemini, Antigravity)
async function refreshGoogle(refreshToken) {
  const params = new URLSearchParams();
  params.set('client_id', '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com');
  params.set('refresh_token', refreshToken);
  params.set('grant_type', 'refresh_token');

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!r.ok) throw new Error('Google refresh HTTP ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const data = await r.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    idToken: data.id_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000
  };
}

// Refresh token untuk Anthropic
async function refreshAnthropic(refreshToken) {
  const params = new URLSearchParams();
  params.set('client_id', '9d1c250a-e61b-44d9-88ed-5944d1962f5e');
  params.set('refresh_token', refreshToken);
  params.set('grant_type', 'refresh_token');

  const r = await fetch('https://console.anthropic.com/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!r.ok) throw new Error('Anthropic refresh HTTP ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const data = await r.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000
  };
}

// Refresh token untuk OpenAI Codex
async function refreshCodex(refreshToken) {
  const params = new URLSearchParams();
  params.set('client_id', 'app_EMoamEEZ73f0CkXaXp7hrann');
  params.set('refresh_token', refreshToken);
  params.set('grant_type', 'refresh_token');
  params.set('scope', 'openid profile email offline_access');

  const r = await fetch('https://auth.openai.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!r.ok) throw new Error('Codex refresh HTTP ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const data = await r.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    idToken: data.id_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000
  };
}

const REFRESHERS = {
  'google-gemini-cli': refreshGoogle,
  'antigravity': refreshGoogle,
  'anthropic-oauth': refreshAnthropic,
  'openai-codex': refreshCodex
};

// Refresh kalau token expired atau < 5 menit lagi expired
export async function ensureFreshToken(providerId, providerType) {
  const token = loadRaw(providerId);
  if (!token) return null;

  const expiresAt = token.expiresAt || 0;
  const remainsMs = expiresAt - Date.now();
  const threshold = 5 * 60 * 1000;

  if (remainsMs > threshold) return token;

  const refresher = REFRESHERS[providerType];
  if (!refresher || !token.refreshToken) {
    console.log('[refresh] ' + providerId + ': no refresher or no refreshToken, token expired');
    return token;
  }

  try {
    console.log('[refresh] ' + providerId + ': refreshing token...');
    const fresh = await refresher(token.refreshToken);
    saveRaw(providerId, { ...token, ...fresh });
    console.log('[refresh] ' + providerId + ': OK, new expiry in ' + Math.round((fresh.expiresAt - Date.now()) / 60000) + 'm');
    return { ...token, ...fresh };
  } catch (e) {
    console.error('[refresh] ' + providerId + ' failed:', e.message);
    return token;
  }
}