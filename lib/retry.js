export async function withRetry(fn, { retries = 2, baseMs = 300, factor = 2 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(i); }
    catch (err) {
      lastErr = err;
      if (i === retries) break;
      const wait = baseMs * Math.pow(factor, i) + Math.random() * 100;
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}
