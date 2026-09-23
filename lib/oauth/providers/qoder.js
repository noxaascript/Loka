import { randomBytes, createHash } from 'crypto';

const API_HOSTS = ['api1.qoder.sh', 'api2.qoder.sh', 'api3.qoder.sh'];
const API_HOST = API_HOSTS[0];
const CLIENT_ID = 'qoder-cli';
const SCOPE = 'openid profile email offline_access';

function generatePkcePair() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export async function start() {
  const { verifier, challenge } = generatePkcePair();
  const nonce = randomBytes(16).toString('hex');
  const machineId = randomBytes(16).toString('hex');

  const url = new URL('https://' + API_HOST + '/device/selectAccounts');
  url.searchParams.set('challenge', challenge);
  url.searchParams.set('challenge_method', 'S256');
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('machine_id', machineId);
  url.searchParams.set('client_id', CLIENT_ID);

  return {
    deviceCode: machineId,
    userCode: null,
    verificationUri: url.toString(),
    interval: 5,
    expiresIn: 1800,
    hint: 'Login di browser, lalu copy JSON token dari DevTools > Application > Local Storage.'
  };
}

export async function poll() {
  return { status: 'pending' };
}

export async function processManualToken(input) {
  let parsed;
  try { parsed = JSON.parse(input.trim()); }
  catch { throw new Error('Format token tidak valid. Paste JSON dari hasil login Qoder.'); }

  const accessToken = parsed.access_token || parsed.accessToken || parsed.token;
  if (!accessToken) throw new Error('access_token tidak ditemukan di JSON');

  return {
    status: 'success',
    token: {
      accessToken,
      refreshToken: parsed.refresh_token || parsed.refreshToken || null,
      expiresAt: Date.now() + (parsed.expires_in || 30 * 24 * 3600) * 1000
    }
  };
}