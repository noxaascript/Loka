import { nextKey } from '../scheduler.js';
import { toAnthropic } from '../translate/toAnthropic.js';
import { fromAnthropic } from '../translate/fromAnthropic.js';

export async function callAnthropic(provider, body, model, opts) {
  const key = nextKey(provider);
  const start = Date.now();
  const res = await fetch(`${provider.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(toAnthropic(body, model)),
    signal: AbortSignal.timeout(opts.timeoutMs)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const raw = await res.json();
  const data = fromAnthropic(raw);
  return { data, latency: Date.now() - start, tokens: data.usage?.total_tokens || 0 };
}
