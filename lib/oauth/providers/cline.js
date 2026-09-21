const WORKOS_URL = 'https://api.workos.com/user_management/authorize/device';
const WORKOS_TOKEN_URL = 'https://api.workos.com/user_management/authenticate';

// WorkOS client ID  Cline & ClinePass pakai client ID production
// (Kalau berubah, akan error 401. Update sesuai versi CLI terbaru.)
const CLINE_CLIENT_ID = 'client_01J2YTNPQ64ZP4P9Q5X8KZQ6R9';
const CLINEPASS_CLIENT_ID = 'client_01J2YTNPQ64ZP4P9Q5X8KZQ6R9';

export function startCline() { return startWith(CLINE_CLIENT_ID); }
export function startClinePass() { return startWith(CLINEPASS_CLIENT_ID); }

async function startWith(clientId) {
  const params = new URLSearchParams();
  params.set('client_id', clientId);
  params.set('scope', 'openid profile email');

  const r = await fetch(WORKOS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const text = await r.text();
  if (!r.ok) throw new Error('WorkOS HTTP ' + r.status + ': ' + text.slice(0, 300));

  const data = JSON.parse(text);
  if (!data.device_code || !data.user_code || !data.verification_uri) {
    throw new Error('Response WorkOS tidak lengkap: ' + text.slice(0, 300));
  }

  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri_complete || data.verification_uri,
    interval: data.interval || 5,
    expiresIn: data.expires_in || 600,
    _clientId: clientId
  };
}

export function pollCline(deviceCode, userCode, session) {
  return pollWith(session && session._clientId ? session._clientId : CLINE_CLIENT_ID, deviceCode);
}

async function pollWith(clientId, deviceCode) {
  const params = new URLSearchParams();
  params.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
  params.set('client_id', clientId);
  params.set('device_code', deviceCode);

  const r = await fetch(WORKOS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      idToken: data.id_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    }
  };
}