import { requireClient } from '../auth.js';
import { getConfig, saveConfig } from '../config.js';
import { startOAuth, pollOAuth, supportsOAuth, manualOAuth } from '../oauth/index.js';
import { saveToken } from '../oauth/store.js';
import { resolveEmail } from '../oauth/email.js';
import { log } from '../logger.js';

const sessions = new Map();

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function html(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

async function finalizeProvider(provider, token) {
  provider.status = 'ready';
  provider.connectedAt = new Date().toISOString();
  provider.oauthType = provider.type;
  try {
    const email = await resolveEmail(provider.type, token);
    if (email) provider.email = email;
  } catch (e) {
    log.warn('email resolve failed', { provider: provider.id, error: e.message });
  }
  saveConfig();
}

export async function handleOAuthStart(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider not found' });
  if (!supportsOAuth(provider.type)) return send(res, 400, { ok: false, error: 'OAuth not supported' });
  try {
    const session = await startOAuth(provider.id, provider.type);
    sessions.set(session.deviceCode, {
      providerId: provider.id,
      type: provider.type,
      userCode: session.userCode,
      startedAt: Date.now()
    });
    log.info('oauth start', { provider: provider.id, userCode: session.userCode });
    send(res, 200, {
      ok: true,
      deviceCode: session.deviceCode,
      userCode: session.userCode,
      verificationUri: session.verificationUri,
      interval: session.interval || 5,
      expiresIn: session.expiresIn || 900
    });
  } catch (err) {
    log.error('oauth start failed', { error: err.message });
    send(res, 500, { ok: false, error: err.message });
  }
}

export async function handleOAuthPoll(req, res, url) {
  requireClient(req);
  const deviceCode = url.searchParams.get('device_code');
  const session = sessions.get(deviceCode);
  if (!session) return send(res, 404, { ok: false, error: 'Invalid device code' });
  if (Date.now() - session.startedAt > 15 * 60 * 1000) {
    sessions.delete(deviceCode);
    return send(res, 410, { ok: false, error: 'Expired' });
  }
  try {
    const result = await pollOAuth(session.providerId, session.type, deviceCode, session.userCode);
    if (result.status === 'success') {
      const cfg = getConfig();
      const provider = cfg.providers.find(p => p.id === session.providerId);
      if (provider) await finalizeProvider(provider, result.token);
      sessions.delete(deviceCode);
      log.info('oauth success', { provider: session.providerId });
      return send(res, 200, { ok: true, status: 'success' });
    }
    if (result.status === 'slow_down') return send(res, 200, { ok: true, status: 'slow_down' });
    return send(res, 200, { ok: true, status: 'pending' });
  } catch (err) {
    sessions.delete(deviceCode);
    log.error('oauth poll failed', { error: err.message });
    send(res, 200, { ok: false, status: 'error', error: err.message });
  }
}

export async function handleOAuthStartLocalhost(req, res, url) {
  requireClient(req);
  return send(res, 400, { ok: false, error: 'Gunakan /api/oauth/start (device flow)' });
}

export async function handleOAuthCallback(req, res, url) {
  return html(res, 400, '<html><body><h1>Not used</h1></body></html>');
}

export async function handleOAuthStatus(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider not found' });
  send(res, 200, { status: provider.status, email: provider.email || null });
}

export async function handleOAuthManualStart(req, res, url) {
  return send(res, 400, { ok: false, error: 'Codex pakai device flow' });
}

export async function handleOAuthManualComplete(req, res, url) {
  return send(res, 400, { ok: false, error: 'Codex pakai device flow' });
}

export async function handleOAuthManualForAnthropic(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const body = await (async () => {
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  })();

  const provider = cfg.providers.find(p => p.id === body.providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider not found' });
  if (provider.type !== 'anthropic-oauth') return send(res, 400, { ok: false, error: 'Not anthropic-oauth' });

  try {
    const result = await manualOAuth(provider.id, provider.type, body.code, body.state);
    if (result.status === 'success') {
      provider.status = 'ready';
      provider.connectedAt = new Date().toISOString();
      provider.oauthType = provider.type;
      saveConfig();
      return send(res, 200, { ok: true, status: 'success' });
    }
    send(res, 200, { ok: false, error: 'Manual flow failed' });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}
