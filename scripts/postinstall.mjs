import { existsSync, mkdirSync, writeFileSync, chmodSync, statSync, renameSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, platform, arch } from 'os';

function getBinDir() {
  if (platform() === 'win32') {
    const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'loka', 'bin');
  }
  const xdg = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  return join(xdg, 'loka', 'bin');
}

const BIN_DIR = getBinDir();
const CF_BASE = 'https://github.com/cloudflare/cloudflared/releases/latest/download';
const RTK_BASE = 'https://github.com/rtk-ai/rtk/releases/latest/download';

function getCloudflared() {
  const p = platform();
  const a = arch();
  if (p === 'win32' && a === 'x64') return { file: 'cloudflared-windows-amd64.exe', bin: 'cloudflared.exe', src: 'cf' };
  if (p === 'darwin' && a === 'x64') return { file: 'cloudflared-darwin-amd64', bin: 'cloudflared', src: 'cf' };
  if (p === 'darwin' && a === 'arm64') return { file: 'cloudflared-darwin-arm64', bin: 'cloudflared', src: 'cf' };
  if (p === 'linux' && a === 'x64') return { file: 'cloudflared-linux-amd64', bin: 'cloudflared', src: 'cf' };
  if (p === 'linux' && a === 'arm64') return { file: 'cloudflared-linux-arm64', bin: 'cloudflared', src: 'cf' };
  if (p === 'linux' && a === 'arm') return { file: 'cloudflared-linux-arm', bin: 'cloudflared', src: 'cf' };
  return null;
}

function getRtk() {
  const p = platform();
  const a = arch();
  if (p === 'win32' && a === 'x64') return { file: 'rtk-windows-amd64.exe', bin: 'rtk.exe', src: 'rtk' };
  if (p === 'darwin' && a === 'x64') return { file: 'rtk-darwin-amd64', bin: 'rtk', src: 'rtk' };
  if (p === 'darwin' && a === 'arm64') return { file: 'rtk-darwin-arm64', bin: 'rtk', src: 'rtk' };
  if (p === 'linux' && a === 'x64') return { file: 'rtk-linux-amd64', bin: 'rtk', src: 'rtk' };
  if (p === 'linux' && a === 'arm64') return { file: 'rtk-linux-arm64', bin: 'rtk', src: 'rtk' };
  return null;
}

async function tryDownload(url, dest) {
  const tmp = dest + '.tmp';
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(180000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 100000) throw new Error('File terlalu kecil: ' + buf.length);
    writeFileSync(tmp, buf);
    renameSync(tmp, dest);
    return buf.length;
  } catch (e) {
    try { if (existsSync(tmp)) unlinkSync(tmp); } catch {}
    throw e;
  }
}

async function ensureBin(name, base, target) {
  if (!target) {
    console.log('[loka-postinstall] ' + name + '  platform tidak didukung, skip');
    return;
  }
  const dest = join(BIN_DIR, target.bin);
  if (existsSync(dest)) {
    try {
      if (statSync(dest).size > 100000) {
        console.log('[loka-postinstall] ' + name + '  sudah ada, skip');
        return;
      }
    } catch {}
  }
  const url = base + '/' + target.file;
  console.log('[loka-postinstall] ' + name + '  downloading...');
  try {
    const size = await tryDownload(url, dest);
    if (platform() !== 'win32') { try { chmodSync(dest, 0o755); } catch {} }
    console.log('[loka-postinstall] ' + name + '  OK (' + Math.round(size/1024/1024) + ' MB)');
  } catch (e) {
    console.log('[loka-postinstall] ' + name + '  gagal: ' + e.message);
    console.log('[loka-postinstall] Download manual: ' + url);
  }
}

async function main() {
  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true });
  await ensureBin('cloudflared', CF_BASE, getCloudflared());
  await ensureBin('rtk', RTK_BASE, getRtk());
  console.log('[loka-postinstall] selesai. Binaries di: ' + BIN_DIR);
}

main().catch(e => {
  console.error('[loka-postinstall] Error:', e.message);
  process.exit(0);
});
