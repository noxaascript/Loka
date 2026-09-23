import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync, unlinkSync } from 'fs';
import { join } from 'path';
import { platform, homedir } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join as pathJoin } from 'path';
import { push as notify } from './tunnel-notify.js';
import { updateCLITunnelUrl } from './cli-config.js';

const STATE_FILE = join(homedir(), '.config', 'loka', 'tunnel.json');
const LOKA_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

let proc = null;
let tunnelUrl = null;
let status = 'stopped';
let lastError = null;
let previousUrl = null;

function loadState() {
  // no-op, state file dibaca terpisah
  try {
    if (!existsSync(STATE_FILE)) return null;
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch { return null; }
}

function saveState() {
  try {
    const dir = join(homedir(), '.config', 'loka');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify({
      url: tunnelUrl,
      status,
      pid: proc ? proc.pid : null,
      lastError,
      updatedAt: new Date().toISOString()
    }, null, 2));
  } catch {}
}

function clearState() {
  try { if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE); } catch {}
}

export function getStatus() {
  return {
    status,
    url: tunnelUrl,
    pid: proc ? proc.pid : null,
    lastError
  };
}

function binPath() {
  const dir = join(LOKA_DIR, 'bin');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const filename = platform() === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  return join(dir, filename);
}

export function isInstalled() {
  return existsSync(binPath());
}

export async function install() {
  status = 'installing';
  lastError = null;
  saveState();
  const outPath = binPath();

  if (existsSync(outPath)) {
    status = 'stopped';
    saveState();
    return { ok: true, path: outPath, already: true };
  }

  let url;
  if (platform() === 'win32') {
    url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
  } else if (platform() === 'darwin') {
    url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz';
    throw new Error('Mac: install via brew dulu: brew install cloudflared');
  } else {
    url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
  }

  try {
    console.log('[tunnel] downloading cloudflared...');
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) throw new Error('Download HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(outPath, buf);
    if (platform() !== 'win32') chmodSync(outPath, 0o755);
    console.log('[tunnel] installed:', outPath);
    status = 'stopped';
    saveState();
    return { ok: true, path: outPath };
  } catch (err) {
    status = 'error';
    lastError = err.message;
    saveState();
    throw err;
  }
}

export function start(port) {
  return new Promise((resolve, reject) => {
    if (proc) {
      return resolve({ ok: true, url: tunnelUrl, already: true });
    }

    const bin = binPath();
    if (!existsSync(bin)) {
      return reject(new Error('cloudflared belum diinstall'));
    }

    status = 'starting';
    tunnelUrl = null;
    lastError = null;
    saveState();

    console.log('[tunnel] starting cloudflared for port', port);

    const args = [
      'tunnel',
      '--url', 'http://localhost:' + port,
      '--no-autoupdate',
      '--loglevel', 'info'
    ];
    console.log('[tunnel] spawn:', bin, args.join(' '));
    proc = spawn(bin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      cwd: LOKA_DIR,
      shell: false
    });

    let buffer = '';
    const urlRegex = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
    let settled = false;

    function handleChunk(chunk) {
      const text = chunk.toString();
      buffer += text;
      const m = buffer.match(urlRegex);
      if (m && !tunnelUrl) {
        const oldUrl = previousUrl || (loadState() && loadState().url) || null;
        tunnelUrl = m[0];
        status = 'running';
        saveState();
        
        // Kalau URL berubah, auto-update CLI + notify
        if (oldUrl && oldUrl !== tunnelUrl) {
          try {
            const updated = updateCLITunnelUrl(oldUrl, tunnelUrl);
            const msg = 'Tunnel URL berubah: ' + oldUrl + '  ' + tunnelUrl 
              + (updated.length ? ' (CLI di-update: ' + updated.join(', ') + '  restart CLI untuk apply)' : '');
            notify('tunnel-url-changed', msg, {
              oldUrl, newUrl: tunnelUrl, updatedCLIs: updated
            });
            console.log('[tunnel] URL changed, notified. Updated CLIs:', updated);
          } catch (e) {
            console.log('[tunnel] notify failed:', e.message);
          }
        }
        previousUrl = tunnelUrl;
        if (!settled) {
          settled = true;
          console.log('[tunnel] URL:', tunnelUrl);
          resolve({ ok: true, url: tunnelUrl });
        }
      }
    }

    proc.stdout.on('data', handleChunk);
    proc.stderr.on('data', handleChunk);

    proc.on('exit', (code) => {
      console.log('[tunnel] exited with code', code);
      proc = null;
      tunnelUrl = null;
      status = 'stopped';
      saveState();
      if (!settled) {
        settled = true;
        reject(new Error('cloudflared exited before giving URL'));
      }
    });

    proc.on('error', (err) => {
      status = 'error';
      lastError = err.message;
      saveState();
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        status = 'error';
        lastError = 'Timeout 40s waiting for URL';
        try { proc.kill(); } catch {}
        reject(new Error('Timeout waiting for tunnel URL'));
      }
    }, 40000);
  });
}

export function stop() {
  if (proc) {
    try { proc.kill(); } catch {}
    proc = null;
  }
  tunnelUrl = null;
  status = 'stopped';
  lastError = null;
  saveState();
}

export function uninstall() {
  stop();
  const bin = binPath();
  try { if (existsSync(bin)) unlinkSync(bin); } catch {}
  clearState();
}

// Auto-restart kalau sebelumnya running
export async function autoResume(port) {
  const state = loadState();
  if (!state) return null;
  if (state.status !== 'running' && state.status !== 'starting') return null;
  if (!isInstalled()) return null;

  console.log('[tunnel] previous state was ' + state.status + ', restarting...');
  try {
    const result = await start(port);
    console.log('[tunnel] resumed with new URL:', result.url);
    return result;
  } catch (err) {
    console.log('[tunnel] auto-resume failed:', err.message);
    return null;
  }
}

// Auto-start tunnel  dipanggil dari index.js setiap server nyala
export async function autoStart(port) {
  if (!isInstalled()) {
    console.log('[tunnel] cloudflared tidak terinstall, skip auto-start');
    return null;
  }
  
  // Cek apakah sudah ada yang jalan
  if (proc) {
    console.log('[tunnel] already running');
    return { ok: true, url: tunnelUrl, already: true };
  }
  
  console.log('[tunnel] auto-starting...');
  try {
    const result = await start(port);
    console.log('[tunnel] auto-start OK:', result.url);
    return result;
  } catch (err) {
    console.log('[tunnel] auto-start failed:', err.message);
    return null;
  }
}
