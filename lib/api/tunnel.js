import { requireClient } from '../auth.js';
import { getConfig } from '../config.js';
import * as tunnel from '../tunnel.js';
import { unread as unreadNotify, markAllRead } from '../tunnel-notify.js';
import { log } from '../logger.js';

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

export async function handleTunnelSetup(req, res, url) {
  requireClient(req);
  try {
    const result = await tunnel.install();
    log.info('tunnel installed');
    send(res, 200, { ok: true, ...result });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}

export async function handleTunnelStart(req, res, url) {
  requireClient(req);
  const cfg = getConfig();
  try {
    const result = await tunnel.start(cfg.port);
    send(res, 200, { ok: true, url: result.url });
  } catch (err) {
    send(res, 500, { ok: false, error: err.message });
  }
}

export function handleTunnelStop(req, res, url) {
  requireClient(req);
  tunnel.stop();
  send(res, 200, { ok: true });
}

export function handleTunnelStatus(req, res, url) {
  requireClient(req);
  const s = tunnel.getStatus();
  s.installed = tunnel.isInstalled();
  send(res, 200, s);
}

export function handleTunnelUninstall(req, res, url) {
  requireClient(req);
  tunnel.uninstall();
  send(res, 200, { ok: true });
}

export function handleTunnelNotifications(req, res, url) {
  requireClient(req);
  const list = unreadNotify();
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ ok: true, notifications: list }));
}

export function handleTunnelMarkRead(req, res, url) {
  requireClient(req);
  markAllRead();
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ ok: true }));
}
