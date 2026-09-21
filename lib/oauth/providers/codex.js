const DEVICE_URL = 'https://auth.openai.com/api/accounts/deviceauth/usercode';
const DEVICE_TOKEN_URL = 'https://auth.openai.com/api/accounts/deviceauth/token';
const OAUTH_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const VERIFY_URL = 'https://auth.openai.com/codex/device';
const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';

// Device flow pakai redirect URI khusus, BUKAN localhost
const DEVICE_REDIRECT_URI = 'https://auth.openai.com/deviceauth/callback';

const UA = 'loka/0.1.0 (device-flow)';

export async function start() {
  const r = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UA
    },
    body: JSON.stringify({ client_id: CLIENT_ID })
  });
  const text = await r.text();
  if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + text.slice(0, 300));
  const data = JSON.parse(text);
  return {
    deviceCode: data.device_auth_id,
    userCode: data.user_code,
    verificationUri: VERIFY_URL,
    interval: parseInt(data.interval, 10) || 5,
    expiresIn: 900
  };
}

export async function poll(deviceCode, userCode) {
  let r;
  try {
    r = await fetch(DEVICE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA
      },
      body: JSON.stringify({
        device_auth_id: deviceCode,
        user_code: userCode
      })
    });
  } catch (fetchErr) {
    const cause = fetchErr.cause;
    console.error('[codex poll] fetch threw:', {
      message: fetchErr.message,
      causeCode: cause && cause.code,
      causeMessage: cause && cause.message
    });
    return { status: 'pending' };
  }

  const text = await r.text();

  if (r.status === 403 || r.status === 404) {
    return { status: 'pending' };
  }
  if (!r.ok) {
    throw new Error('HTTP ' + r.status + ': ' + text.slice(0, 300));
  }

  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('Invalid JSON: ' + text.slice(0, 200)); }

  if (!data.authorization_code) return { status: 'pending' };

  // Token exchange pakai form-urlencoded + redirect URI khusus device
  const params = new URLSearchParams();
  params.set('client_id', CLIENT_ID);
  params.set('code', data.authorization_code);
  params.set('grant_type', 'authorization_code');
  params.set('redirect_uri', DEVICE_REDIRECT_URI);
  params.set('code_verifier', data.code_verifier);

  let tr;
  try {
    tr = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA
      },
      body: params.toString()
    });
  } catch (fetchErr) {
    const cause = fetchErr.cause;
    throw new Error('Token exchange fetch failed: ' + fetchErr.message +
      (cause ? ' (' + (cause.code || cause.message) + ')' : ''));
  }

  const ttext = await tr.text();
  if (!tr.ok) throw new Error('Token HTTP ' + tr.status + ': ' + ttext.slice(0, 300));

  const tokens = JSON.parse(ttext);
  return {
    status: 'success',
    token: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      accountId: tokens.account_id || extractAccountId(tokens.id_token),
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000
    }
  };
}

export async function startLocalhost() {
  throw new Error('Codex pakai device flow');
}

export function generatePkce() {
  return { verifier: '', challenge: '' };
}

export function authUrlFromChallenge() {
  return '';
}

export async function processManualCode() {
  throw new Error('Codex pakai device flow');
}

function extractAccountId(idToken) {
  if (!idToken) return null;
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload['https://api.openai.com/auth']?.chatgpt_account_id || null;
  } catch { return null; }
}