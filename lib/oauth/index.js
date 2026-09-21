import * as codex from './providers/codex.js';
import * as copilot from './providers/github-copilot.js';
import * as xai from './providers/xai.js';
import * as gemini from './providers/gemini.js';
import * as anthropic from './providers/anthropic.js';
import { saveToken, loadToken, deleteToken, listTokens } from './store.js';

const PROVIDERS = {
  'openai-codex': codex,
  'github-copilot': copilot,
  'xai': xai,
  'google-gemini-cli': gemini,
  'anthropic-oauth': anthropic
};

export function supportsOAuth(type) {
  return Boolean(PROVIDERS[type]);
}

export async function startOAuth(providerId, type) {
  const mod = PROVIDERS[type];
  if (!mod) throw new Error('OAuth not supported for type: ' + type);
  const session = await mod.start();
  return { ...session, providerId, type };
}

export async function pollOAuth(providerId, type, deviceCode, userCode) {
  const mod = PROVIDERS[type];
  if (!mod) throw new Error('OAuth not supported for type: ' + type);
  const result = await mod.poll(deviceCode, userCode);
  if (result.status === 'success') {
    saveToken(providerId, result.token);
    return { status: 'success', token: result.token };
  }
  return result;
}

export async function manualOAuth(providerId, type, code, state) {
  const mod = PROVIDERS[type];
  if (!mod || typeof mod.processManualCode !== 'function') {
    throw new Error('Manual flow not supported for ' + type);
  }
  const result = await mod.processManualCode(code, state);
  if (result.status === 'success') {
    saveToken(providerId, result.token);
  }
  return result;
}

export { loadToken, deleteToken, listTokens };