import { randomBytes, createHash } from 'crypto';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:51121/oauth2callback';
const SCOPES = 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid';

const pending = new Map();

function pkce() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(16).toString('hex');
  return { verifier, challenge, state };
}

export async function start() {
  const { verifier, challenge, state } = pkce();
  pending.set(state, { verifier, createdAt: Date.now() });

  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);

  return {
    deviceCode: state,
    userCode: null,
    verificationUri: url.toString(),
    interval: 0,
    expiresIn: 600,
    manualPaste: true,
    hint: 'Login Google, lalu copy URL callback atau kode dari address bar.'
  };
}

export async function poll() {
  return { status: 'pending' };
}

export async function completeLocalhost(code, state) {
  const session = pending.get(state);
  if (!session) throw new Error('Sesi Antigravity tidak ditemukan atau expired');
  pending.delete(state);

  const params = new URLSearchParams();
  params.set('client_id', CLIENT_ID);
  params.set('code', code);
  params.set('grant_type', 'authorization_code');
  params.set('redirect_uri', REDIRECT_URI);
  params.set('code_verifier', session.verifier);

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Token HTTP ' + r.status + ': ' + text.slice(0, 300));

  const tokens = JSON.parse(text);
  let email = null;
  if (tokens.id_token) {
    try {
      const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString());
      email = payload.email || null;
    } catch {}
  }

  return {
    status: 'success',
    token: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      email,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000
    }
  };
}