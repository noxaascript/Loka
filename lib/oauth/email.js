export function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch { return null; }
}

export function extractEmailFromIdToken(idToken) {
  const payload = decodeJwt(idToken);
  if (!payload) return null;
  if (typeof payload.email === 'string') return payload.email.toLowerCase();
  return null;
}

export async function fetchGitHubEmail(accessToken) {
  try {
    const r = await fetch('https://api.github.com/user/emails', {
      headers: { 'Authorization': 'Bearer ' + accessToken, 'User-Agent': 'Loka' }
    });
    if (!r.ok) return null;
    const list = await r.json();
    const primary = list.find(e => e.primary && e.verified) || list.find(e => e.primary) || list[0];
    return primary ? primary.email : null;
  } catch { return null; }
}

export async function fetchGoogleEmail(accessToken) {
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.email || null;
  } catch { return null; }
}

export async function resolveEmail(providerType, token) {
  if (!token) return null;
  let email = null;

  if (token.idToken) {
    email = extractEmailFromIdToken(token.idToken);
    if (email) return email;
  }

  if (providerType === 'github-copilot' && token.accessToken) {
    email = await fetchGitHubEmail(token.accessToken);
    if (email) return email;
  }

  if ((providerType === 'google-gemini-cli' || providerType === 'gemini') && token.accessToken) {
    email = await fetchGoogleEmail(token.accessToken);
    if (email) return email;
  }

  return null;
}
