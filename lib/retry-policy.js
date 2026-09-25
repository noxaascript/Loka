// Klasifikasi error + kebijakan retry/fallback

export const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
export const FALLBACK_STATUS  = new Set([401, 403, 404, 410, 451, 402]);
export const FATAL_STATUS     = new Set([400, 422]);

// Status bisa datang dari err.status, err.statusCode, atau dari message "HTTP 503: ..."
export function extractStatus(err) {
  if (!err) return 0;
  if (typeof err.status === 'number') return err.status;
  if (typeof err.statusCode === 'number') return err.statusCode;
  const m = String(err.message || '').match(/\b(?:HTTP\s*)?(\d{3})\b/);
  if (m) return parseInt(m[1], 10);
  return 0;
}

// Retry-After bisa dari header atau dari err.retryAfter
export function extractRetryAfter(err) {
  if (!err) return 0;
  if (typeof err.retryAfter === 'number') return err.retryAfter;
  const ra = err.headers && (err.headers['retry-after'] || err.headers['Retry-After']);
  if (ra) {
    const n = parseFloat(ra);
    if (!isNaN(n)) return n;
    const d = new Date(ra).getTime();
    if (!isNaN(d)) return Math.max(0, (d - Date.now()) / 1000);
  }
  return 0;
}

// Kind: 'retry' | 'fallback' | 'fatal'
export function classifyError(err) {
  const status = extractStatus(err);
  const msg = String(err && err.message || '').toLowerCase();

  // Cek kata kunci dulu (untuk provider yang gak kasih status)
  if (/rate\s*limit|too many requests|quota exceeded|token quota/.test(msg)) return 'retry';
  if (/service unavailable|temporarily unavailable|server error|bad gateway|gateway timeout/.test(msg)) return 'retry';
  if (/unauthorized|forbidden|invalid (api )?key|revoked|suspended|disabled/.test(msg)) return 'fallback';
  if (/insufficient|out of credit|billing|payment required/.test(msg)) return 'fallback';

  if (RETRYABLE_STATUS.has(status)) return 'retry';
  if (FALLBACK_STATUS.has(status)) return 'fallback';
  if (FATAL_STATUS.has(status)) return 'fatal';

  // Default: anggap fallback (biar ada kesempatan provider lain)
  return status ? 'fallback' : 'retry';
}

// Exponential backoff dengan jitter
export function backoffMs(attempt, retryAfterSec) {
  if (retryAfterSec && retryAfterSec > 0) {
    return Math.min(retryAfterSec * 1000, 30000);
  }
  const base = Math.min(8000, 400 * Math.pow(2, attempt));
  const jitter = Math.random() * 300;
  return Math.round(base + jitter);
}

export function summarizeError(err) {
  const status = extractStatus(err);
  const msg = String(err && err.message || 'unknown').slice(0, 220);
  return status ? `HTTP ${status}: ${msg}` : msg;
}
