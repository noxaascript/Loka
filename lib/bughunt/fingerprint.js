import { createHash } from 'crypto';

export function normalizeMessage(msg) {
  return String(msg || '')
    .replace(/[a-f0-9]{8,}/gi, '<HEX>')
    .replace(/\d+/g, '<N>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

export function normalizeStack(stack) {
  if (!stack) return '';
  return String(stack)
    .split('\n')
    .slice(0, 6)
    .map(l => l.replace(/:\d+:\d+/g, ':<N>:<N>').replace(/\d+/g, '<N>'))
    .join('\n');
}

export function fingerprint(err, context = {}) {
  const msg = normalizeMessage(err && err.message || err);
  const stack = normalizeStack(err && err.stack);
  const provider = context.provider || '';
  const model = context.model || '';
  const route = context.route || '';
  const input = [msg, stack, provider, model, route].join('|');
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}
