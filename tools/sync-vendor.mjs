import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, rmSync, renameSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENDOR = join(ROOT, 'vendor');

function run(cmd, args, opts = {}) {
  const p = platform();
  if (p === 'win32') {
    return execFileAsync('cmd.exe', ['/c', cmd, ...args], {
      timeout: 300000, maxBuffer: 50 * 1024 * 1024, windowsHide: true, ...opts
    });
  }
  return execFileAsync(cmd, args, {
    timeout: 300000, maxBuffer: 50 * 1024 * 1024, ...opts
  });
}

async function syncCaveman() {
  const dest = join(VENDOR, 'caveman');
  console.log('[vendor] caveman  cloning...');
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  await run('git', ['clone', '--depth', '1', 'https://github.com/JuliusBrussee/caveman.git', dest]);
  const gitDir = join(dest, '.git');
  if (existsSync(gitDir)) rmSync(gitDir, { recursive: true, force: true });
  console.log('[vendor] caveman  OK');
}

async function syncHeadroom() {
  const dest = join(VENDOR, 'headroom');
  console.log('[vendor] headroom  packing...');
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(VENDOR, { recursive: true });

  // npm pack di vendor/, hasilnya headroom-ai-X.Y.Z.tgz
  await run('npm', ['pack', 'headroom-ai'], { cwd: VENDOR });

  const files = readdirSync(VENDOR).filter(f => f.startsWith('headroom-ai-') && f.endsWith('.tgz'));
  if (!files.length) throw new Error('headroom-ai tgz tidak ditemukan');

  const tgz = join(VENDOR, files[0]);
  // extract pakai tar (bundled di Windows 10+)
  await run('tar', ['-xzf', files[0]], { cwd: VENDOR });
  const extracted = join(VENDOR, 'package');
  if (!existsSync(extracted)) throw new Error('extract gagal');
  renameSync(extracted, dest);
  rmSync(tgz, { force: true });
  console.log('[vendor] headroom  OK');
}

async function main() {
  if (!existsSync(VENDOR)) mkdirSync(VENDOR, { recursive: true });

  const skip = process.argv[2];
  const tasks = { caveman: syncCaveman, headroom: syncHeadroom };

  if (skip && tasks[skip]) {
    await tasks[skip]();
  } else {
    for (const [name, fn] of Object.entries(tasks)) {
      try { await fn(); }
      catch (e) { console.log('[vendor] ' + name + '  gagal: ' + e.message); }
    }
  }
  console.log('');
  console.log('[vendor] selesai. Cek folder vendor/');
}

main().catch(e => { console.error(e); process.exit(1); });
