const DEVICE_URL = 'https://auth.x.ai/oauth2/device';
const TOKEN_URL = 'https://auth.x.ai/oauth2/token';
const CLIENT_ID = 'b1a00492-073a-47ea-816f-4c329264a828';
const SCOPE = 'openid profile email offline_access grok-cli:access api:access conversations:read';
const REFERRER = 'grok-build';

export async function start() {
  const r = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: SCOPE,
      referrer: REFERRER
    })
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Device HTTP ' + r.status + ': ' + text.slice(0, 300));

  const data = JSON.parse(text);
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || 'https://auth.x.ai/activate',
    interval: data.interval || 5,
    expiresIn: data.expires_in || 600
  };
}

export async function poll(deviceCode) {
  const params = new URLSearchParams();
  params.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
  params.set('client_id', CLIENT_ID);
  params.set('device_code', deviceCode);
  // JANGAN kirim code_verifier  xAI device flow tidak pakai PKCE[citation:6]

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON: ' + text.slice(0, 200)); }

  if (data.error === 'authorization_pending') return { status: 'pending' };
  if (data.error === 'slow_down') return { status: 'slow_down' };
  if (data.error === 'access_denied' || data.error === 'authorization_denied') {
    throw new Error('Authorization denied oleh user');
  }
  if (data.error) throw new Error(data.error_description || data.error);

  return {
    status: 'success',
    token: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    }
  };
}

export async function startLocalhost() {
  throw new Error('xAI pakai device flow');
}

export function generatePkce() {
  return { verifier: '', challenge: '' };
}

export function authUrlFromChallenge() {
  return '';
}

export async function processManualCode() {
  throw new Error('xAI pakai device flow');
}