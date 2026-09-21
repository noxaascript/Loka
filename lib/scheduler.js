const cooldowns = new Map();
const keyCursor = new Map();
const failures = new Map();

const FAIL_THRESHOLD = 3;
const DEFAULT_COOLDOWN = 60_000;

export function inCooldown(providerId) {
  const until = cooldowns.get(providerId) || 0;
  return Date.now() < until;
}

export function cooldown(providerId, ms = DEFAULT_COOLDOWN) {
  cooldowns.set(providerId, Date.now() + ms);
}

export function clearCooldown(providerId) {
  cooldowns.delete(providerId);
  failures.delete(providerId);
}

export function recordFailure(providerId) {
  const n = (failures.get(providerId) || 0) + 1;
  failures.set(providerId, n);
  if (n >= FAIL_THRESHOLD) cooldown(providerId);
}

export function recordSuccess(providerId) {
  failures.delete(providerId);
  cooldowns.delete(providerId);
}

export function nextKey(provider) {
  const keys = provider.apiKeys || [];
  if (!keys.length) return null;
  const idx = keyCursor.get(provider.id) || 0;
  keyCursor.set(provider.id, (idx + 1) % keys.length);
  return keys[idx];
}

export function cooldownSnapshot() {
  const now = Date.now();
  const out = {};
  for (const [id, until] of cooldowns) {
    if (until > now) out[id] = Math.ceil((until - now) / 1000);
  }
  return out;
}
