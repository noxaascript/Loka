const KILO_API = 'https://api.kilo.ai';

export async function start() {
  const r = await fetch(KILO_API + '/api/device-auth/codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  const text = await r.text();
  if (!r.ok) throw new Error('Device HTTP ' + r.status + ': ' + text.slice(0, 300));

  const data = JSON.parse(text);
  return {
    deviceCode: data.code || data.device_code || data.deviceCode,
    userCode: data.user_code || data.userCode || null,
    verificationUri: data.verificationUrl || data.verification_uri || data.verificationUri || 'https://kilo.ai/device',
    interval: data.interval || 5,
    expiresIn: data.expiresIn || 300
  };
}

export async function poll(deviceCode) {
  const r = await fetch(KILO_API + '/api/device-auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: deviceCode })
  });

  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON: ' + text.slice(0, 200)); }

  if (r.status === 404 || data.status === 'pending' || data.error === 'authorization_pending') {
    return { status: 'pending' };
  }
  if (data.error && data.error !== 'authorization_pending') {
    throw new Error(data.error_description || data.error);
  }
  if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + text.slice(0, 300));

  const token = data.token || data.access_token || data.accessToken;
  if (!token) return { status: 'pending' };

  return {
    status: 'success',
    token: {
      accessToken: token,
      refreshToken: data.refresh_token || data.refreshToken || null,
      expiresAt: Date.now() + (data.expiresIn || data.expires_in || 3600) * 1000
    }
  };
}