import { randomUUID } from 'crypto';
import { toCodex } from '../translate/toCodex.js';
import { fromCodexStream } from '../translate/fromCodex.js';
import { loadToken } from '../oauth/index.js';
import { loadTokenFresh } from '../oauth/store.js';

export async function callCodex(provider, body, model, opts) {
  // Auto-refresh token kalau expired
  let token = await loadTokenFresh(provider.id, provider.type);
  if (!token) token = loadToken(provider.id);

  if (!token || !token.accessToken) {
    throw new Error('OAuth token Codex tidak ditemukan. Connect dulu dari halaman Providers.');
  }

  const accountId = token.accountId || extractAccountId(token.accessToken);
  if (!accountId) throw new Error('Account ID Codex tidak ditemukan di token');

  const sessionId = randomUUID();
  const url = 'https://chatgpt.com/backend-api/codex/responses';
  const codexBody = toCodex({ ...body, model });

  const start = Date.now();
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': 'Bearer ' + token.accessToken,
      'chatgpt-account-id': accountId,
      'OpenAI-Beta': 'responses=experimental',
      'originator': 'codex_cli_rs',
      'session_id': sessionId,
      'x-client-request-id': sessionId,
      'User-Agent': 'codex_cli_rs/0.21.0'
    },
    body: JSON.stringify(codexBody)
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error('HTTP ' + r.status + ': ' + errText.slice(0, 500));
  }

  const data = await fromCodexStream(r.body, model);
  const latency = Date.now() - start;
  return {
    data,
    latency,
    tokens: data.usage.total_tokens || 0
  };
}

function extractAccountId(accessToken) {
  if (!accessToken) return null;
  const parts = accessToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload['https://api.openai.com/auth']?.chatgpt_account_id || null;
  } catch { return null; }
}