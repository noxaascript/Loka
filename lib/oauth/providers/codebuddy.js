const BASE = 'https://copilot.tencent.com';
const UA = 'CLI/2.63.2 CodeBuddy/2.63.2';

export async function start() {
  const r = await fetch(BASE + '/v2/plugin/auth/state?platform=CLI', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA
    },
    body: JSON.stringify({})
  });

  const text = await r.text();
  if (!r.ok) throw new Error('State HTTP ' + r.status + ': ' + text.slice(0, 300));

  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON: ' + text.slice(0, 200)); }

  const state = data.state || (data.data && data.data.state);
  const authUrl = data.authUrl || data.url || (data.data && (data.data.authUrl || data.data.url));

  if (!state || !authUrl) throw new Error('Response tidak ada state/authUrl: ' + text.slice(0, 300));

  return {
    deviceCode: state,
    userCode: null,
    verificationUri: authUrl,
    interval: 3,
    expiresIn: 600
  };
}

export async function poll(state) {
  const r = await fetch(BASE + '/v2/plugin/auth/token?state=' + encodeURIComponent(state), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA
    }
  });

  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { return { status: 'pending' }; }

  if (r.status === 404 || r.status === 202) return { status: 'pending' };

  if (!r.ok) {
    if (data.error === 'authorization_pending') return { status: 'pending' };
    throw new Error('HTTP ' + r.status + ': ' + text.slice(0, 300));
  }

  const token = data.accessToken || data.access_token || (data.data && (data.data.accessToken || data.data.access_token));
  if (!token) return { status: 'pending' };

  return {
    status: 'success',
    token: {
      accessToken: token,
      refreshToken: data.refreshToken || data.refresh_token || (data.data && (data.data.refreshToken || data.data.refresh_token)) || null,
      expiresAt: Date.now() + (data.expiresIn || data.expires_in || (data.data && (data.data.expiresIn || data.data.expires_in)) || 3600) * 1000
    }
  };
}