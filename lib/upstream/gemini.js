import { nextKey } from '../scheduler.js';
import { toGemini } from '../translate/toGemini.js';
import { fromGemini } from '../translate/fromGemini.js';

export async function callGemini(provider, body, model, opts) {
  const key = nextKey(provider);
  const start = Date.now();
  const url = `${provider.baseUrl}/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toGemini(body)),
    signal: AbortSignal.timeout(opts.timeoutMs)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const raw = await res.json();
  const data = fromGemini(raw);
  return { data, latency: Date.now() - start, tokens: data.usage?.total_tokens || 0 };
}
