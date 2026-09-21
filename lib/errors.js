const FALLBACK_STATUS = new Set([404, 408, 409, 425, 429, 500, 502, 503, 504, 522, 524]);
const FATAL_STATUS = new Set([400, 401, 403, 422]);

export function isFallbackEligible(err) {
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return true;
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND' || err?.code === 'ETIMEDOUT') return true;

  const msg = String(err?.message || '');
  const m = msg.match(/HTTP (\d{3})/);
  if (m) {
    const status = parseInt(m[1], 10);
    if (FATAL_STATUS.has(status)) return false;
    if (FALLBACK_STATUS.has(status)) return true;
    if (status >= 500) return true;
  }
  return true;
}

export function classifyError(err) {
  const msg = String(err?.message || '');
  const m = msg.match(/HTTP (\d{3})/);
  const status = m ? parseInt(m[1], 10) : null;
  return {
    status,
    fatal: status !== null && FATAL_STATUS.has(status),
    fallback: isFallbackEligible(err),
    message: msg
  };
}
