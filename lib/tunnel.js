import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, chmodSync, unlinkSync } from 'fs';
import { join } from 'path';
import { platform } from 'os';

let proc = null;
let tunnelUrl = null;
let status = 'stopped';
let lastError = null;

export function getStatus() {
  return {
    status,
    url: tunnelUrl,
    pid: proc ? proc.pid : null,
    lastError
  };
}

function binPath() {
  const dir = join(process.cwd(), 'bin');
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
  const outPath = binPath();

  if (existsSync(outPath)) {
    status = 'stopped';
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
    return { ok: true, path: outPath };
  } catch (err) {
    status = 'error';
    lastError = err.message;
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

    console.log('[tunnel] starting cloudflared for port', port);

    proc = spawn(bin, [
      'tunnel',
      '--url', 'http://localhost:' + port,
      '--no-autoupdate',
      '--loglevel', 'info'
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    let buffer = '';
    const urlRegex = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
    let settled = false;

    function handleChunk(chunk) {
      const text = chunk.toString();
      buffer += text;
      const m = buffer.match(urlRegex);
      if (m && !tunnelUrl) {
        tunnelUrl = m[0];
        status = 'running';
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
      if (!settled) {
        settled = true;
        reject(new Error('cloudflared exited before giving URL'));
      }
    });

    proc.on('error', (err) => {
      status = 'error';
      lastError = err.message;
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
}

export function uninstall() {
  stop();
  const bin = binPath();
  try { if (existsSync(bin)) unlinkSync(bin); } catch {}
}