import * as codex from './providers/codex.js';
import * as copilot from './providers/github-copilot.js';
import * as gemini from './providers/gemini.js';
import * as anthropic from './providers/anthropic.js';
import * as antigravity from './providers/antigravity.js';
import * as kimi from './providers/kimi.js';
import * as kilo from './providers/kilo.js';
import * as cursor from './providers/cursor.js';
import * as qoder from './providers/qoder.js';
import * as codebuddy from './providers/codebuddy.js';
import * as cline from './providers/cline.js';
import * as mimo from './providers/mimo.js';
import { saveToken, loadToken, deleteToken, listTokens } from './store.js';

const PROVIDERS = {
  'openai-codex': codex,
  'github-copilot': copilot,
  'google-gemini-cli': gemini,
  'anthropic-oauth': anthropic,
  'antigravity': antigravity,
  'kimi': kimi,
  'kilo': kilo,
  'cursor': cursor,
  'qoder': qoder,
  'codebuddy': codebuddy,
  'cline': cline,
  'clinepass': cline,
  'mimo': mimo
};

// Provider yang butuh special handling (manual paste / instant / localhost)
export const MANUAL_PASTE_TYPES = ['qoder'];
export const INSTANT_TYPES = ['mimo'];
export const LOCALHOST_TYPES = ['openai-codex', 'google-gemini-cli', 'antigravity', 'cursor'];

export function supportsOAuth(type) {
  return Boolean(PROVIDERS[type]);
}

export function getOAuthModule(type) {
  return PROVIDERS[type] || null;
}

export async function startOAuth(providerId, type) {
  const mod = PROVIDERS[type];
  if (!mod) throw new Error('OAuth not supported for type: ' + type);
  const session = await mod.start();
  return { ...session, providerId, type };
}

export async function pollOAuth(providerId, type, deviceCode, userCode, session) {
  const mod = PROVIDERS[type];
  if (!mod) throw new Error('OAuth not supported for type: ' + type);
  const result = await mod.poll(deviceCode, userCode, session);
  if (result.status === 'success') {
    saveToken(providerId, result.token);
    return { status: 'success', token: result.token };
  }
  return result;
}

export async function manualOAuth(providerId, type, code, state) {
  const mod = PROVIDERS[type];
  if (!mod) throw new Error('OAuth not supported for type: ' + type);

  if (typeof mod.processManualCode === 'function') {
    const result = await mod.processManualCode(code, state);
    if (result.status === 'success') saveToken(providerId, result.token);
    return result;
  }
  if (typeof mod.processManualToken === 'function') {
    const result = await mod.processManualToken(code);
    if (result.status === 'success') saveToken(providerId, result.token);
    return result;
  }
  throw new Error('Manual flow not supported untuk ' + type);
}

export async function completeLocalhostOAuth(providerId, type, code, state) {
  const mod = PROVIDERS[type];
  if (!mod || typeof mod.completeLocalhost !== 'function') {
    throw new Error('Localhost flow not supported untuk ' + type);
  }
  const result = await mod.completeLocalhost(code, state);
  if (result.status === 'success') {
    saveToken(providerId, result.token);
  }
  return result;
}

export { loadToken, deleteToken, listTokens };