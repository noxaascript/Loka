import { randomBytes, createHash } from 'crypto';

function generateSessionId(seed) {
  if (seed) {
    // ? connectionId ?????? ID????????
    const hash = createHash('sha256').update(String(seed)).digest('hex');
    return 'ses_' + hash.slice(0, 26);
  }
  // ????ses_ + 12 lowercase hex + 14 alnum
  const hex = randomBytes(6).toString('hex');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const buf = randomBytes(14);
  let alnum = '';
  for (let i = 0; i < 14; i++) alnum += chars[buf[i] % chars.length];
  return 'ses_' + hex + alnum;
}

function generateRequestId() {
  return 'msg_' + randomBytes(12).toString('hex');
}

export async function callOpenCodeZen(provider, body, model, opts) {
  const key = (provider.apiKeys && provider.apiKeys[0]) || 'public';
  const start = Date.now();

  // ? provider.id + model ?????????
  const seed = provider.id + ':' + model + ':' + (opts.sessionKey || 'default');
  const sessionId = generateSessionId(seed);
  const requestId = generateRequestId();

  const url = provider.baseUrl.replace(/\/$/, '') + '/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
      'User-Agent': 'opencode/1.18.18',
      'x-opencode-client': 'cli',
      'x-opencode-project': 'global',
      'x-opencode-session': sessionId,
      'x-opencode-request': requestId
    },
    body: JSON.stringify({ ...body, model }),
    signal: AbortSignal.timeout(opts.timeoutMs || 60000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error('HTTP ' + res.status + ': ' + errText.slice(0, 300));
  }

  const data = await res.json();
  return {
    data,
    latency: Date.now() - start,
    tokens: data.usage?.total_tokens || 0
  };
}