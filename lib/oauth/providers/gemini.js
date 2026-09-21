const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CLIENT_ID = '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid';

const pending = new Map();

export async function start() {
  const { verifier, challenge, state } = await generatePkce();
  const redirectUri = 'http://localhost:1455/oauth2callback';

  pending.set(state, { verifier, redirectUri, createdAt: Date.now() });

  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
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
    expiresIn: 600
  };
}

export async function poll(state) {
  const session = pending.get(state);
  if (!session) return { status: 'pending' };

  // Localhost callback mode  tunggu code masuk via completeLocalhost
  return { status: 'pending' };
}

export async function completeLocalhost(code, state) {
  const session = pending.get(state);
  if (!session) throw new Error('Sesi OAuth Google tidak ditemukan atau expired');
  pending.delete(state);

  const params = new URLSearchParams();
  params.set('client_id', CLIENT_ID);
  params.set('code', code);
  params.set('grant_type', 'authorization_code');
  params.set('redirect_uri', session.redirectUri);
  params.set('code_verifier', session.verifier);

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Token HTTP ' + r.status + ': ' + text.slice(0, 300));

  const tokens = JSON.parse(text);
  return {
    status: 'success',
    token: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000
    }
  };
}

async function generatePkce() {
  const crypto = await import('crypto');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');
  return { verifier, challenge, state };
}