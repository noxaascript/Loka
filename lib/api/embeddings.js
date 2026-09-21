import { requireClient } from '../auth.js';
import { getConfig } from '../config.js';
import { nextKey } from '../scheduler.js';

export async function handleEmbeddings(req, res, body) {
  const cfg = getConfig();
  requireClient(req);

  const target = cfg.providers.find(p => p.type === 'openai' && p.tags?.includes('embed'))
    || cfg.providers.find(p => p.type === 'openai');

  if (!target) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: 'Tidak ada provider embeddings' } }));
  }

  const key = nextKey(target);
  const upstream = await fetch(`${target.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.requestTimeoutMs || 60000)
  });

  const data = await upstream.text();
  res.writeHead(upstream.status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(data);
}
