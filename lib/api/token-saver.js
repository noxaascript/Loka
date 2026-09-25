import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir, platform } from 'os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(__dirname, '..', '..', 'vendor');
const ROOT = join(__dirname, '..', '..');

function getDataDir() {
  if (platform() === 'win32') {
    const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'loka');
  }
  const xdg = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  return join(xdg, 'loka');
}

const DATA_DIR = getDataDir();
const STATS_FILE = join(DATA_DIR, 'token-saver.json');

function loadStats() {
  try {
    if (!existsSync(STATS_FILE)) return { savedTokens: 0, totalTokens: 0, savedCost: 0 };
    return JSON.parse(readFileSync(STATS_FILE, 'utf8'));
  } catch {
    return { savedTokens: 0, totalTokens: 0, savedCost: 0 };
  }
}

export function saveStats(stats) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch {}
}

async function which(bin) {
  try {
    const cmd = platform() === 'win32' ? 'where' : 'which';
    const { stdout } = await execFileAsync(cmd, [bin], { timeout: 5000, windowsHide: true });
    return stdout.trim().split(/\r?\n/)[0] || null;
  } catch {
    return null;
  }
}

function vendorPath(name) {
  const p = join(VENDOR, name);
  return existsSync(p) ? p : null;
}

function lokaBinPath(bin) {
  if (platform() === 'win32') {
    const appData = process.env.APPDATA || '';
    const p = join(appData, 'loka', 'bin', bin + '.exe');
    return existsSync(p) ? p : null;
  }
  const xdg = process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  const p = join(xdg, 'loka', 'bin', bin);
  return existsSync(p) ? p : null;
}

async function checkRtk() {
  const vendored = vendorPath('rtk');
  if (vendored) return { installed: true, path: vendored, source: 'vendor' };
  const local = lokaBinPath('rtk');
  if (local) return { installed: true, path: local, source: 'loka-bin' };
  const sys = await which('rtk');
  return { installed: !!sys, path: sys, source: sys ? 'system' : null };
}

async function checkHeadroom() {
  const vendored = vendorPath('headroom');
  if (vendored) return { installed: true, path: vendored, source: 'vendor' };
  const sys = await which('headroom');
  if (sys) return { installed: true, path: sys, source: 'system' };
  return { installed: false, source: null };
}

async function checkCaveman() {
  const vendored = vendorPath('caveman');
  if (vendored) return { installed: true, path: vendored, source: 'vendor' };
  const claudeSkill = join(homedir(), '.claude', 'skills', 'caveman');
  if (existsSync(claudeSkill)) return { installed: true, path: claudeSkill, source: 'claude-skill' };
  const sys = await which('caveman') || await which('cave');
  return { installed: !!sys, path: sys, source: sys ? 'system' : null };
}

export async function handleTokenSaverStatus(req, res) {
  const [rtk, headroom, caveman] = await Promise.all([
    checkRtk(), checkHeadroom(), checkCaveman()
  ]);
  const stats = loadStats();
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ rtk, headroom, caveman, stats, vendorDir: VENDOR }));
}

//  Config get/set 
const LOKA_JSON = join(ROOT, 'loka.json');

function loadLokaConfig() {
  try {
    if (!existsSync(LOKA_JSON)) return {};
    return JSON.parse(readFileSync(LOKA_JSON, 'utf8'));
  } catch {
    return {};
  }
}

function saveLokaConfig(cfg) {
  writeFileSync(LOKA_JSON, JSON.stringify(cfg, null, 2));
}

const DEFAULT_TS = {
  rtk: {
    enabled: false,
    ultraCompact: false
  },
  headroom: {
    enabled: false,
    proxyUrl: 'http://localhost:8787'
  },
  caveman: {
    enabled: false,
    mode: 'full',
    thinkMode: 'compress'
  }
};

export async function handleTokenSaverConfigGet(req, res) {
  const cfg = loadLokaConfig();
  const ts = Object.assign({}, DEFAULT_TS, cfg.tokenSaver || {});
  // deep merge per tool
  for (const k of ['rtk', 'headroom', 'caveman']) {
    ts[k] = Object.assign({}, DEFAULT_TS[k], (cfg.tokenSaver && cfg.tokenSaver[k]) || {});
  }
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ ok: true, tokenSaver: ts }));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
  catch { return {}; }
}

export async function handleTokenSaverConfigSet(req, res) {
  const body = await readBody(req);
  const tool = body.tool;
  const values = body.values || {};
  if (!tool || !['rtk', 'headroom', 'caveman'].includes(tool)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'Unknown tool: ' + tool }));
  }

  const cfg = loadLokaConfig();
  if (!cfg.tokenSaver) cfg.tokenSaver = {};
  cfg.tokenSaver[tool] = Object.assign({}, DEFAULT_TS[tool], cfg.tokenSaver[tool] || {}, values);
  saveLokaConfig(cfg);

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ ok: true, tokenSaver: cfg.tokenSaver }));
}

//  Install 
const INSTALL_CMDS = {
  rtk: {
    linux: ['sh', ['-c', 'curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh']],
    darwin: ['sh', ['-c', 'curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh']],
    win32: null
  },
  headroom: {
    linux: ['npm', ['install', '-g', 'headroom-ai']],
    darwin: ['npm', ['install', '-g', 'headroom-ai']],
    win32: ['npm', ['install', '-g', 'headroom-ai']]
  },
  caveman: {
    linux: ['npm', ['install', '-g', '@caveman-ai/cli']],
    darwin: ['npm', ['install', '-g', '@caveman-ai/cli']],
    win32: ['npm', ['install', '-g', '@caveman-ai/cli']]
  }
};

function runCmd(cmd, args) {
  if (platform() === 'win32') {
    return execFileAsync('cmd.exe', ['/c', cmd, ...args], {
      timeout: 180000, maxBuffer: 10 * 1024 * 1024, windowsHide: true
    });
  }
  return execFileAsync(cmd, args, {
    timeout: 180000, maxBuffer: 10 * 1024 * 1024
  });
}

export async function handleTokenSaverInstall(req, res) {
  const body = await readBody(req);
  const tool = body.tool;
  if (!tool || !INSTALL_CMDS[tool]) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'Unknown tool: ' + tool }));
  }

  const spec = INSTALL_CMDS[tool][platform()];
  if (!spec) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: false,
      error: 'Install otomatis ' + tool + ' belum didukung di Windows. Pakai WSL atau Git Bash.'
    }));
  }

  const [cmd, args] = spec;
  try {
    const { stdout, stderr } = await runCmd(cmd, args);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, stdout: stdout.slice(-2000), stderr: stderr.slice(-1000) }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: e.message, stderr: (e.stderr || '').slice(-1000) }));
  }
}
