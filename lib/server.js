import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getConfig } from './config.js';
import { log } from './logger.js';
import { handleChat } from './api/chat.js';
import { handleMessages } from './api/messages.js';
import { handleModels } from './api/models.js';
import { handleEmbeddings } from './api/embeddings.js';
import { handleHealth } from './api/health.js';
import { handleAdmin } from './api/admin.js';
import {
  handleTestProvider,
  handleConnectProvider,
  handleDisconnectProvider
} from './api/providers.js';
import { handleCombos } from './api/combos.js';
import { handleKeys } from './api/keys.js';
import { handleAddApiKey, handleRemoveApiKey } from './api/apikey.js';
import { handleImportModels } from './api/import-models.js';
import { handleTestModel } from './api/test-model.js';
import { handleTunnelSetup, handleTunnelStart, handleTunnelStop, handleTunnelStatus, handleTunnelUninstall, handleTunnelNotifications, handleTunnelMarkRead } from './api/tunnel.js';
import { handleCLIDetect, handleCLIConfigure, handleCLIReset } from './api/cli.js';
import { handleUpdateCheck, handleUpdateProxy, handleUpdateCli } from './api/update.js';
import { getUpdateState } from './update-checker.js';
import {
  handleOAuthStart,
  handleOAuthPoll,
  handleOAuthStartLocalhost,
  handleOAuthStatus,
  handleOAuthManualStart,
  handleOAuthManualComplete,
  handleOAuthCallback,
  handleOAuthPasteToken
} from './api/oauth.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderProviders } from './ui/providers.js';
import { renderCombos } from './ui/combos.js';
import { renderKeys } from './ui/keys.js';
import { renderUsage } from './ui/usage.js';
import { renderTunnel } from './ui/tunnel.js';
import { renderSettings } from './ui/settings.js';
import { renderLogs } from './ui/logs.js';
import { renderCLI } from './ui/cli.js';

// Global error handlers  biar server nggak crash
process.on('unhandledRejection', (err) => {
  console.error('[unhandled]', err && err.message ? err.message : err);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaught]', err && err.message ? err.message : err);
});

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { throw new Error('Invalid JSON'); }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key,anthropic-version,anthropic-beta');
}

function json(res, code, data) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function html(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

export function startServer() {
  const cfg = getConfig();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'x'));

    if (req.method === 'OPTIONS') {
      cors(res);
      res.writeHead(204);
      return res.end();
    }

    try {
      // ===== UI Routes =====
      if (url.pathname === '/' || url.pathname === '/dashboard') {
        return html(res, 200, renderDashboard());
      }
      if (url.pathname === '/tunnel')    return html(res, 200, renderTunnel());
      if (url.pathname === '/providers') return html(res, 200, renderProviders());
      if (url.pathname === '/combos')    return html(res, 200, renderCombos());
      if (url.pathname === '/keys')      return html(res, 200, renderKeys());
      if (url.pathname === '/usage')     return html(res, 200, renderUsage());
      if (url.pathname === '/settings')  return html(res, 200, renderSettings());
      if (url.pathname === '/logs')      return html(res, 200, renderLogs());
      if (url.pathname === '/cli')       return html(res, 200, renderCLI());

      // ===== OAuth callback (public, no auth) =====
      if (url.pathname === '/oauth/callback') {
        return await handleOAuthCallback(req, res, url);
      }

      // ===== OpenAI-compatible API =====
      if (url.pathname === '/health')    return handleHealth(req, res);
      if (url.pathname === '/v1/models') return handleModels(req, res);

      if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
        const body = await readBody(req);
        return await handleChat(req, res, body);
      }
      if (url.pathname === '/v1/messages' && req.method === 'POST') {
        const body = await readBody(req);
        return await handleMessages(req, res, body);
      }
      if (url.pathname === '/v1/embeddings' && req.method === 'POST') {
        const body = await readBody(req);
        return await handleEmbeddings(req, res, body);
      }

      // ===== Provider management =====
      if (url.pathname === '/api/test-provider')       return await handleTestProvider(req, res, url);
      if (url.pathname === '/api/connect-provider')    return await handleConnectProvider(req, res, url);
      if (url.pathname === '/api/disconnect-provider') return await handleDisconnectProvider(req, res, url);
      if (url.pathname === '/api/test-model')          return await handleTestModel(req, res, url);
      if (url.pathname === '/api/add-api-key')         return await handleAddApiKey(req, res, url);
      if (url.pathname === '/api/remove-api-key')      return await handleRemoveApiKey(req, res, url);
      if (url.pathname === '/api/import-models')       return await handleImportModels(req, res, url);

      // ===== OAuth =====
      if (url.pathname === '/api/oauth/start')           return await handleOAuthStart(req, res, url);
      if (url.pathname === '/api/oauth/poll')            return await handleOAuthPoll(req, res, url);
      if (url.pathname === '/api/oauth/start-localhost') return await handleOAuthStartLocalhost(req, res, url);
      if (url.pathname === '/api/oauth/poll-status')     return await handleOAuthStatus(req, res, url);
      if (url.pathname === '/api/oauth/manual-start')    return await handleOAuthManualStart(req, res, url);
      if (url.pathname === '/api/oauth/manual-complete') return await handleOAuthManualComplete(req, res, url);
      if (url.pathname === '/api/oauth/paste-token')     return await handleOAuthPasteToken(req, res, url);

      // ===== Tunnel =====
      if (url.pathname === '/api/tunnel/setup')     return await handleTunnelSetup(req, res, url);
      if (url.pathname === '/api/tunnel/start')     return await handleTunnelStart(req, res, url);
      if (url.pathname === '/api/tunnel/stop')      return handleTunnelStop(req, res, url);
      if (url.pathname === '/api/tunnel/status')    return handleTunnelStatus(req, res, url);
      if (url.pathname === '/api/tunnel/uninstall') return handleTunnelUninstall(req, res, url);
      if (url.pathname === '/api/tunnel/notifications') return handleTunnelNotifications(req, res, url);
      if (url.pathname === '/api/tunnel/mark-read')     return handleTunnelMarkRead(req, res, url);

      // ===== CLI Connector =====
      if (url.pathname === '/api/cli/detect')    return handleCLIDetect(req, res, url);
      if (url.pathname === '/api/cli/configure') return await handleCLIConfigure(req, res, url);
      if (url.pathname === '/api/cli/reset')     return await handleCLIReset(req, res, url);
      if (url.pathname === '/api/update/check')  return await handleUpdateCheck(req, res, url);
      if (url.pathname === '/api/update/proxy')  return await handleUpdateProxy(req, res, url);
      if (url.pathname === '/api/update/cli')    return await handleUpdateCli(req, res, url);
      if (url.pathname === '/api/update/state')  { cors(res); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(getUpdateState())); }

      // ===== Combos =====
      if (url.pathname.startsWith('/api/combos/')) return await handleCombos(req, res, url);

      // ===== API Keys =====
      if (url.pathname.startsWith('/api/keys/')) return await handleKeys(req, res, url);

      // ===== Admin =====
      if (url.pathname.startsWith('/admin/')) return handleAdmin(req, res, url);

      // ===== Static icons =====
      if (url.pathname.startsWith('/icons/')) {
        const name = url.pathname.replace('/icons/', '').replace(/[^a-z0-9._-]/gi, '');
        const file = join(process.cwd(), 'lib', 'ui', 'icons', name);
        if (existsSync(file)) {
          res.writeHead(200, {
            'Content-Type': name.toLowerCase().endsWith('.png') ? 'image/png' : name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
          });
          return res.end(readFileSync(file));
        }
      }

      // ===== 404 =====
      return html(res, 404, '<!DOCTYPE html><html><head><meta charset="utf-8"><title>404</title><style>body{font-family:system-ui;background:#fff;color:#1f2328;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}h1{font-size:3rem;margin:0;color:#cf222e}p{color:#656d76}a{color:#0969da;text-decoration:none}</style></head><body><div><h1>404</h1><p>Not found: <code>' + url.pathname + '</code></p><p><a href="/">Home</a></p></div></body></html>');

    } catch (err) {
      log.error('server error', { error: err.message, path: url.pathname });
      const status = err.status || 500;
      if (res.headersSent) {
        try { res.end(); } catch {}
        return;
      }
      json(res, status, {
        error: {
          message: err.message,
          type: status === 401 ? 'invalid_request_error' : 'server_error'
        }
      });
    }
  });

  server.on('error', (err) => {
    console.error('[server]', err.message);
  });

  server.listen(cfg.port, cfg.host || '0.0.0.0', () => {
    log.info('Loka running at http://localhost:' + cfg.port);
    const primaryKey = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '-';
    console.log('\n  Loka AI Router\n  --------------------------------\n  Endpoint  : http://localhost:' + cfg.port + '/v1\n  Dashboard : http://localhost:' + cfg.port + '/\n  API Key   : ' + primaryKey + '\n    ');
  });

  return server;
}