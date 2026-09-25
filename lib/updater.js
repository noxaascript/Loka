import { execSync, spawn } from 'child_process';
import { platform } from 'os';

const NPM_REGISTRY = 'https://registry.npmjs.org';

// Mapping CLI id -> npm package
const CLI_PACKAGES = {
  'claude-code': { pkg: '@anthropic-ai/claude-code', bin: 'claude' },
  'codex': { pkg: '@openai/codex', bin: 'codex' },
  'opencode': { pkg: 'opencode-ai', bin: 'opencode' },
  'gemini-cli': { pkg: '@google/gemini-cli', bin: 'gemini' }
};

// Package Loka sendiri
const LOKA_PACKAGE = 'loka-ai-router';

function isWin() { return platform() === 'win32'; }

// Fetch latest version dari npm registry
export async function getLatestVersion(pkgName) {
  try {
    const url = NPM_REGISTRY + '/' + encodeURIComponent(pkgName).replace('%40', '@') + '/latest';
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    return {
      version: data.version,
      description: data.description,
      publishedAt: data.time || null
    };
  } catch (err) {
    return { error: err.message };
  }
}

// Get installed version via npm list -g --json
export function getInstalledVersion(pkgName) {
  try {
    const cmd = isWin() ? 'npm.cmd' : 'npm';
    const out = execSync(cmd + ' list -g ' + pkgName + ' --json', {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: true
    });
    const data = JSON.parse(out);
    if (data.dependencies && data.dependencies[pkgName]) {
      return data.dependencies[pkgName].version || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Compare two semver strings
function isNewer(latest, current) {
  if (!current) return true;
  if (!latest) return false;
  if (latest === current) return false;

  // Ambil tanggal YYYYMMDD dari versi
  const dateOf = (v) => {
    const m = String(v).match(/(\d{8})/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const dl = dateOf(latest);
  const dc = dateOf(current);

  // Kalau dua-duanya ada tanggal, compare tanggal
  if (dl && dc) {
    if (dl !== dc) return dl > dc;
    return false;
  }

  // Fallback semver
  const norm = (v) => String(v).replace(/^v/, '').split('-')[0].split('.').map(Number);
  const [la, lb, lc] = norm(latest);
  const [ca, cb, cc] = norm(current);
  if (la !== ca) return la > ca;
  if (lb !== cb) return lb > cb;
  return lc > cc;
}

// Check single package
export async function checkPackage(pkgName) {
  const [latest, installed] = await Promise.all([
    getLatestVersion(pkgName),
    Promise.resolve(getInstalledVersion(pkgName))
  ]);

  if (latest.error) {
    return { pkg: pkgName, installed, error: latest.error };
  }

  return {
    pkg: pkgName,
    installed,
    latest: latest.version,
    updateAvailable: isNewer(latest.version, installed)
  };
}

// Check all CLIs + Loka
export async function checkAll() {
  const results = {};

  // Check Loka sendiri
  results.loka = await checkPackage(LOKA_PACKAGE);

  // Check each CLI
  for (const [id, info] of Object.entries(CLI_PACKAGES)) {
    results[id] = await checkPackage(info.pkg);
    results[id].bin = info.bin;
  }

  return results;
}

// Update package  spawn npm install -g, return promise
export function updatePackage(pkgName, tag) {
  return new Promise((resolve) => {
    const spec = tag ? pkgName + '@' + tag : pkgName + '@latest';
    const cmd = isWin() ? 'npm.cmd' : 'npm';
    const args = ['install', '-g', spec];

    console.log('[updater] running: ' + cmd + ' ' + args.join(' '));

    const proc = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWin(),
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (c) => { stdout += c.toString(); });
    proc.stderr.on('data', (c) => { stderr += c.toString(); });

    const timeout = setTimeout(() => {
      try { proc.kill(); } catch {}
      resolve({ ok: false, error: 'Timeout 5 menit' });
    }, 5 * 60 * 1000);

    proc.on('exit', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ ok: true, output: stdout.slice(-2000) });
      } else {
        resolve({ ok: false, error: stderr.slice(-2000) || 'Exit code ' + code });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ ok: false, error: err.message });
    });
  });
}

export function getCliPackages() {
  return Object.keys(CLI_PACKAGES);
}

export function getPackageFor(cliId) {
  return CLI_PACKAGES[cliId] || null;
}

export { LOKA_PACKAGE };