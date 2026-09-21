const buckets = new Map();

export function allow(clientKey, { windowMs = 60000, max = 120 } = {}) {
  const now = Date.now();
  const list = (buckets.get(clientKey) || []).filter(t => now - t < windowMs);
  if (list.length >= max) {
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  buckets.set(clientKey, list);
  return { ok: true, remaining: max - list.length };
}

export function reset(clientKey) { buckets.delete(clientKey); }
