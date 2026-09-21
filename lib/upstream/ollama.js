export async function callOllama(provider, body, model, opts) {
  const start = Date.now();
  const res = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, model }),
    signal: AbortSignal.timeout(opts.timeoutMs)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return { data, latency: Date.now() - start, tokens: data.usage?.total_tokens || 0 };
}
