import { randomBytes, createHash } from 'crypto';

const AUTH_URL = 'https://claude.ai/oauth/authorize';
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback';
const SCOPES = 'org:create_api_key user:profile user:inference';

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
  url.searchParams.set('state', state);

  return {
    deviceCode: state,
    userCode: null,
    verificationUri: url.toString(),
    interval: 0,
    expiresIn: 600,
    manualPaste: true,
    hint: 'Setelah login, copy kode dari halaman Claude dan paste di sini.'
  };
}

export async function poll() {
  return { status: 'pending' };
}

export async function processManualCode(input, state) {
  const session = pending.get(state);
  if (!session) throw new Error('Session expired, coba Connect OAuth lagi');
  if (Date.now() - session.createdAt > 15 * 60 * 1000) {
    pending.delete(state);
    throw new Error('Session timeout');
  }

  let code = input.trim();
  let returnedState = state;

  // Format dari Claude: "code#state"
  if (code.includes('#')) {
    const parts = code.split('#');
    code = parts[0];
    returnedState = parts[1] || state;
  }

  const params = new URLSearchParams();
  params.set('client_id', CLIENT_ID);
  params.set('code', code);
  params.set('grant_type', 'authorization_code');
  params.set('redirect_uri', REDIRECT_URI);
  params.set('code_verifier', session.verifier);
  params.set('state', returnedState);

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const text = await r.text();
  if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + text.slice(0, 300));

  const data = JSON.parse(text);
  pending.delete(state);

  return {
    status: 'success',
    token: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    }
  };
}