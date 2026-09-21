const DEVICE_URL = 'https://github.com/login/device/code';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const CLIENT_ID = 'Iv1.b507a08c87ecfe98';

export async function start() {
  const r = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: 'read:user' })
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    interval: data.interval || 5,
    expiresIn: data.expires_in || 900
  };
}

export async function poll(deviceCode) {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })
  });
  const data = await r.json();
  if (data.error === 'authorization_pending') return { status: 'pending' };
  if (data.error === 'slow_down') return { status: 'slow_down' };
  if (data.error) throw new Error(data.error_description || data.error);
  return {
    status: 'success',
    token: {
      accessToken: data.access_token,
      tokenType: data.token_type,
      scope: data.scope
    }
  };
}
