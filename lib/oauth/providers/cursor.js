import { randomBytes, createHash } from 'crypto';
import { createServer } from 'http';
import { URL } from 'url';

const AUTH_URL = 'https://cursor.com/agents/mcp/oauth/authorize';
const TOKEN_URL = 'https://cursor.com/agents/mcp/oauth/token';
const CLIENT_ID = 'cursor-cli-oauth';
const REDIRECT_URI = 'http://localhost:8787/callback';
const SCOPE = 'openid profile email';

const pending = new Map();

function pkce() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(16).toString('hex');
  return { verifier, challenge, state };
}

function createCursorCallbackServer(port, path) {
  return new Promise((resolve, reject) => {
    let done = false;
    const server = createServer((req, res) => {
      const u = new URL(req.url, 'http://localhost:' + port);
      if (u.pathname !== path) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const code = u.searchParams.get('code');
      const state = u.searchParams.get('state');
      const err = u.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (err) {
        res.end('<h1>Gagal</h1><p>' + err + '</p>');
        if (!done) { done = true; reject(new Error(err)); }
      } else if (code) {
        res.end('<h1>Berhasil</h1><p>Tutup jendela ini dan kembali ke Loka.</p>');
        if (!done) { done = true; resolve({ code, state }); }
      } else {
        res.end('<h1>Menunggu...</h1>');
      }
      setTimeout(() => server.close(), 500);
    });

    server.listen(port, '127.0.0.1', () => {
      console.log('[cursor] callback server on http://localhost:' + port + path);
    });
    server.on('error', (e) => {
      if (!done) { done = true; reject(new Error(e.code === 'EADDRINUSE' ? 'Port ' + port + ' sedang dipakai' : e.message)); }
    });
    setTimeout(() => {
      if (!done) { done = true; server.close(); reject(new Error('Timeout 5 menit')); }
    }, 300000);
  });
}

export async function startLocalhost() {
  const { verifier, challenge, state } = pkce();
  pending.set(state, { verifier, createdAt: Date.now() });

  const callbackPromise = createCursorCallbackServer(8787, '/callback');

  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  return {
    verificationUri: url.toString(),
    state,
    callbackPromise: callbackPromise.then(async (result) => {
      const tokens = await exchangeCode(result.code, verifier);
      return { status: 'success', token: tokens };
    })
  };
}

async function exchangeCode(code, verifier) {
  const params = new URLSearchParams();
  params.set('client_id', CLIENT_ID);
  params.set('code', code);
  params.set('grant_type', 'authorization_code');
  params.set('redirect_uri', REDIRECT_URI);
  params.set('code_verifier', verifier);

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Token HTTP ' + r.status + ': ' + text.slice(0, 300));

  const data = JSON.parse(text);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000
  };
}

export async function start() { throw new Error('Cursor pakai localhost flow'); }
export async function poll() { return { status: 'pending' }; }