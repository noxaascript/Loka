import { requireClient } from '../auth.js';
import { getConfig, saveConfig } from '../config.js';
import {
  startOAuth,
  pollOAuth,
  manualOAuth,
  completeLocalhostOAuth,
  supportsOAuth,
  getOAuthModule,
  loadToken
} from '../oauth/index.js';
import { saveToken } from '../oauth/store.js';
import { resolveEmail } from '../oauth/email.js';
import { log } from '../logger.js';

const sessions = new Map();
const pendingLocalhost = new Map();
const pendingManual = new Map();

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
    else if (token.email) provider.email = token.email;
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

  const mod = getOAuthModule(provider.type);

  // Cursor pakai startLocalhost (bukan start)
  if (provider.type === 'cursor' && typeof mod.startLocalhost === 'function') {
    try {
      const r = await mod.startLocalhost();
      pendingLocalhost.set(r.state, provider.id);
      send(res, 200, { ok: true, verificationUri: r.verificationUri, localhost: true });
      r.callbackPromise.then(async (result) => {
        if (result.status === 'success') {
          saveToken(provider.id, result.token);
          await finalizeProvider(provider, result.token);
          log.info('cursor oauth success', { provider: provider.id });
        }
      }).catch((err) => {
        log.error('cursor oauth failed', { error: err.message });
      });
      return;
    } catch (err) {
      return send(res, 500, { ok: false, error: err.message });
    }
  }

  // MiMo instant (device flow yang langsung return token)
  if (provider.type === 'mimo') {
    try {
      const session = await startOAuth(provider.id, provider.type);
      sessions.set(session.deviceCode, { providerId: provider.id, type: provider.type, session, startedAt: Date.now() });
      return send(res, 200, {
        ok: true,
        deviceCode: session.deviceCode,
        userCode: session.userCode || null,
        verificationUri: session.verificationUri || null,
        interval: 1,
        instant: true
      });
    } catch (err) {
      return send(res, 500, { ok: false, error: err.message });
    }
  }

  // Manual paste flow (Qoder)
  if (mod.MANUAL_PASTE_TYPES && mod.MANUAL_PASTE_TYPES.includes(provider.type)) {
    try {
      const session = await startOAuth(provider.id, provider.type);
      pendingManual.set(session.deviceCode, { providerId: provider.id, type: provider.type, session });
      return send(res, 200, {
        ok: true,
        deviceCode: session.deviceCode,
        userCode: session.userCode,
        verificationUri: session.verificationUri,
        manualPaste: true,
        hint: session.hint || 'Paste JSON token hasil login.'
      });
    } catch (err) {
      return send(res, 500, { ok: false, error: err.message });
    }
  }

  // Standard device flow
  try {
    const session = await startOAuth(provider.id, provider.type);
    sessions.set(session.deviceCode, {
      providerId: provider.id,
      type: provider.type,
      session,
      userCode: session.userCode,
      startedAt: Date.now()
    });
    send(res, 200, {
      ok: true,
      deviceCode: session.deviceCode,
      userCode: session.userCode,
      verificationUri: session.verificationUri,
      interval: session.interval || 5,
      expiresIn: session.expiresIn || 900
    });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}

export async function handleOAuthPoll(req, res, url) {
  requireClient(req);
  const deviceCode = url.searchParams.get('device_code');
  const session = sessions.get(deviceCode);
  if (!session) return send(res, 404, { ok: false, error: 'Invalid device code' });
  if (Date.now() - session.startedAt > 20 * 60 * 1000) {
    sessions.delete(deviceCode);
    return send(res, 410, { ok: false, error: 'Expired' });
  }

  try {
    const result = await pollOAuth(
      session.providerId,
      session.type,
      deviceCode,
      session.userCode,
      session.session
    );

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
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider not found' });

  const mod = getOAuthModule(provider.type);
  if (!mod || typeof mod.startLocalhost !== 'function') {
    return send(res, 400, { ok: false, error: 'Localhost flow not supported for ' + provider.type });
  }

  try {
    const r = await mod.startLocalhost();
    pendingLocalhost.set(r.state, provider.id);
    send(res, 200, { ok: true, verificationUri: r.verificationUri });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}

export async function handleOAuthCallback(req, res, url) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) return html(res, 400, '<html><body><h1>Gagal</h1><p>' + error + '</p></body></html>');
  if (!code || !state) return html(res, 400, '<html><body><h1>Invalid callback</h1></body></html>');

  const providerId = pendingLocalhost.get(state);
  if (!providerId) return html(res, 400, '<html><body><h1>Sesi tidak ditemukan</h1></body></html>');

  const cfg = getConfig();
  const provider = cfg.providers.find(p => p.id === providerId);
  if (!provider) return html(res, 400, '<html><body><h1>Provider hilang</h1></body></html>');

  try {
    const result = await completeLocalhostOAuth(provider.id, provider.type, code, state);
    if (result.status === 'success') {
      await finalizeProvider(provider, result.token);
      pendingLocalhost.delete(state);
      return html(res, 200, '<html><head><meta charset="utf-8"></head><body style="font-family:system-ui;text-align:center;padding:3rem;background:#f6f8fa"><div style="max-width:400px;margin:auto;background:#fff;padding:2rem;border-radius:12px"><h1 style="color:#1a7f37">Berhasil</h1><p>Akun <b>' + (provider.email || provider.id) + '</b> terhubung.</p><p>Tutup tab ini.</p></div></body></html>');
    }
  } catch (err) {
    log.error('oauth callback failed', { error: err.message });
    return html(res, 500, '<html><body><h1 style="color:#cf222e">Gagal</h1><p>' + err.message + '</p></body></html>');
  }
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
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const provider = cfg.providers.find(p => p.id === providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider not found' });

  const mod = getOAuthModule(provider.type);
  if (!mod || typeof mod.start !== 'function') {
    return send(res, 400, { ok: false, error: 'Manual flow not supported' });
  }

  try {
    const session = await startOAuth(provider.id, provider.type);
    pendingManual.set(session.deviceCode, { providerId: provider.id, type: provider.type, session });
    send(res, 200, {
      ok: true,
      deviceCode: session.deviceCode,
      verificationUri: session.verificationUri,
      hint: session.hint || null
    });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}

export async function handleOAuthManualComplete(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const providerId = url.searchParams.get('id');
  const callbackUrl = url.searchParams.get('callback_url');
  const provider = cfg.providers.find(p => p.id === providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider not found' });
  if (!callbackUrl) return send(res, 400, { ok: false, error: 'callback_url wajib' });

  try {
    const result = await manualOAuth(provider.id, provider.type, callbackUrl, null);
    if (result.status === 'success') {
      await finalizeProvider(provider, result.token);
      send(res, 200, { ok: true, status: 'success' });
    } else {
      send(res, 200, { ok: false, error: 'Manual flow failed' });
    }
  } catch (err) {
    log.error('oauth manual failed', { error: err.message });
    send(res, 500, { ok: false, error: err.message });
  }
}

// Manual paste untuk Qoder
export async function handleOAuthPasteToken(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  const body = await (async () => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  })();

  const provider = cfg.providers.find(p => p.id === body.providerId);
  if (!provider) return send(res, 404, { ok: false, error: 'Provider not found' });

  try {
    const result = await manualOAuth(provider.id, provider.type, body.token, null);
    if (result.status === 'success') {
      await finalizeProvider(provider, result.token);
      send(res, 200, { ok: true, status: 'success' });
    } else {
      send(res, 200, { ok: false, error: 'Paste token failed' });
    }
  } catch (err) {
    log.error('paste token failed', { error: err.message });
    send(res, 500, { ok: false, error: err.message });
  }
}