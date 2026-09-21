import { nextKey } from '../scheduler.js';

export async function callOpenAI(provider, body, model, opts) {
  const key = nextKey(provider);
  const start = Date.now();
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ ...body, model }),
    signal: AbortSignal.timeout(opts.timeoutMs)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return { data, latency: Date.now() - start, tokens: data.usage?.total_tokens || 0 };
}

export async function callOpenAIStream(provider, body, model, opts) {
  const key = nextKey(provider);
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ ...body, model, stream: true }),
    signal: AbortSignal.timeout(opts.timeoutMs)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.body;
}
