import { fingerprint } from './fingerprint.js';
import { recordOccurrence } from './store.js';

let enabled = false;
let hooksInstalled = false;

export function setEnabled(v) { enabled = !!v; }

function sanitize(body) {
  if (!body) return null;
  try {
    const s = JSON.stringify(body);
    if (s.length > 8000) return { _truncated: true, preview: s.slice(0, 8000) };
    return JSON.parse(s);
  } catch { return null; }
}

export function captureError(err, context = {}) {
  if (!enabled) return;
  try {
    const fp = fingerprint(err, context);
    const entry = {
      message: String(err && err.message || err).slice(0, 500),
      stack: err && err.stack ? String(err.stack).split('\n').slice(0, 15).join('\n') : '',
      status: (err && err.status) || 0,
      route: context.route || '',
      provider: context.provider || '',
      model: context.model || '',
      requestBody: sanitize(context.body),
      meta: context.meta || {}
    };
    recordOccurrence(fp, entry);
  } catch {}
}

export function installProcessHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  process.on('uncaughtException', (err) => {
    captureError(err, { route: 'process.uncaughtException' });
  });
  process.on('unhandledRejection', (err) => {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      route: 'process.unhandledRejection'
    });
  });
}
