const DEVICE_URL = 'https://auth.kimi.com/api/oauth/device_authorization';
const TOKEN_URL = 'https://auth.kimi.com/api/oauth/token';
const VERIFY_URL = 'https://kimi.com/code/authorize_device';
const CLIENT_ID = '17e5f671-d194-4dfb-9706-5516cb48c098';

export async function start() {
  const r = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID })
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Device HTTP ' + r.status + ': ' + text.slice(0, 300));

  const data = JSON.parse(text);
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || VERIFY_URL,
    interval: data.interval || 5,
    expiresIn: data.expires_in || 600
  };
}

export async function poll(deviceCode) {
  const params = new URLSearchParams();
  params.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
  params.set('client_id', CLIENT_ID);
  params.set('device_code', deviceCode);

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