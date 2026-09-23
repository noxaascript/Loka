#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync, chmodSync, statSync } from 'fs';
import { join } from 'path';
import { homedir, platform, arch } from 'os';

const BIN_DIR = join(homedir(), '.config', 'loka', 'bin');

// Mirror GitHub Releases (ganti USERNAME ke github kamu)
const MIRROR_BASE = 'https://github.com/noxaascript/Loka/releases/latest/download';
// Fallback Cloudflare CDN
const CF_BASE = 'https://github.com/cloudflare/cloudflared/releases/latest/download';

function getTarget() {
  const p = platform();
  const a = arch();

  // Deteksi Termux (Android)
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');

  if (p === 'win32') {
    if (a === 'x64') return { file: 'cloudflared-windows-amd64.exe', bin: 'cloudflared.exe', cf: 'cloudflared-windows-amd64.exe', termux: false };
    if (a === 'arm64') return { file: 'cloudflared-windows-arm64.exe', bin: 'cloudflared.exe', cf: 'cloudflared-windows-arm64.exe', termux: false };
    return null;
  }

  if (p === 'darwin') {
    if (a === 'x64') return { file: 'cloudflared-darwin-amd64', bin: 'cloudflared', cf: 'cloudflared-darwin-amd64', termux: false };
    if (a === 'arm64') return { file: 'cloudflared-darwin-arm64', bin: 'cloudflared', cf: 'cloudflared-darwin-arm64', termux: false };
    return null;
  }

  if (p === 'linux') {
    if (isTermux) {
      // Termux: cuma support arm64 via linux-arm64, tapi bisa glibc issue
      return { file: 'cloudflared-linux-arm64', bin: 'cloudflared', cf: 'cloudflared-linux-arm64', termux: true };
    }
    if (a === 'x64') return { file: 'cloudflared-linux-amd64', bin: 'cloudflared', cf: 'cloudflared-linux-amd64', termux: false };
    if (a === 'arm64') return { file: 'cloudflared-linux-arm64', bin: 'cloudflared', cf: 'cloudflared-linux-arm64', termux: false };
    if (a === 'arm') return { file: 'cloudflared-linux-arm', bin: 'cloudflared', cf: 'cloudflared-linux-arm', termux: false };
    if (a === 'ia32') return { file: 'cloudflared-linux-386', bin: 'cloudflared', cf: 'cloudflared-linux-386', termux: false };
    return null;
  }

  return null;
}

async function tryDownload(url, dest) {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 100000) throw new Error('File terlalu kecil: ' + buf.length + ' bytes');
  writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  const target = getTarget();

  if (!target) {
    console.log('[loka-postinstall] platform ' + platform() + '/' + arch() + ' tidak didukung untuk auto-download cloudflared.');
    console.log('[loka-postinstall] Download manual: https://github.com/cloudflare/cloudflared/releases');
    return;
  }

  if (target.termux) {
    console.log('[loka-postinstall] Termux terdeteksi  cloudflared di Termux butuh proot/glibc-runner.');
    console.log('[loka-postinstall] Setup manual: pkg install proot && proot-distro install alpine');
    console.log('[loka-postinstall] Setelah itu, install cloudflared di dalam proot.');
    return;
  }

  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true });
  const dest = join(BIN_DIR, target.bin);

  // Cek existing
  if (existsSync(dest)) {
    try {
      const size = statSync(dest).size;
      if (size > 1000000) {
        console.log('[loka-postinstall] cloudflared sudah ada (' + Math.round(size/1024/1024) + ' MB), skip download');
        return;
      }
    } catch {}
  }

  console.log('[loka-postinstall] Downloading cloudflared untuk ' + platform() + '/' + arch() + '...');

  // Coba mirror dulu
  const mirrorUrl = MIRROR_BASE + '/' + target.file;
  const cfUrl = CF_BASE + '/' + target.cf;

  try {
    const size = await tryDownload(mirrorUrl, dest);
    console.log('[loka-postinstall]  Downloaded from mirror (' + Math.round(size/1024/1024) + ' MB)');
  } catch (e1) {
    console.log('[loka-postinstall] Mirror gagal (' + e1.message + '), coba Cloudflare...');
    try {
      const size = await tryDownload(cfUrl, dest);
      console.log('[loka-postinstall]  Downloaded from Cloudflare (' + Math.round(size/1024/1024) + ' MB)');
    } catch (e2) {
      console.log('[loka-postinstall]  Download gagal: ' + e2.message);
      console.log('[loka-postinstall] Download manual: https://github.com/cloudflare/cloudflared/releases');
      console.log('[loka-postinstall] Simpan ke: ' + dest);
      return;
    }
  }

  // Set executable on Unix
  if (platform() !== 'win32') {
    try { chmodSync(dest, 0o755); } catch {}
  }

  console.log('[loka-postinstall] Binary disimpan di: ' + dest);
}

main().catch((e) => {
  console.error('[loka-postinstall] Error:', e.message);
  // Jangan fail install  cuma warning
  process.exit(0);
});