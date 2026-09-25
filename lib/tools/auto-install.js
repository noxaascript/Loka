import { execFile } from 'child_process';
import { promisify } from 'util';
import { platform, homedir } from 'os';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(__dirname, '..', '..', 'vendor');

function runCmd(cmd, args, opts = {}) {
  const p = platform();
  if (p === 'win32') {
    return execFileAsync('cmd.exe', ['/c', cmd, ...args], {
      timeout: 300000, maxBuffer: 10 * 1024 * 1024, windowsHide: true, ...opts
    });
  }
  return execFileAsync(cmd, args, {
    timeout: 300000, maxBuffer: 10 * 1024 * 1024, ...opts
  });
}

async function which(bin) {
  try {
    const cmd = platform() === 'win32' ? 'where' : 'which';
    const { stdout } = await execFileAsync(cmd, [bin], { timeout: 5000, windowsHide: true });
    return stdout.trim().split(/\r?\n/)[0] || null;
  } catch { return null; }
}

function checkCommonPaths(bin) {
  const candidates = [];
  if (platform() === 'win32') {
    const appData = process.env.APPDATA || '';
    const localAppData = process.env.LOCALAPPDATA || '';
    candidates.push(
      join(appData, 'loka', 'bin', bin + '.exe'),
      join(localAppData, 'loka', 'bin', bin + '.exe'),
      join(appData, 'npm', bin + '.cmd')
    );
  } else {
    candidates.push(
      join(homedir(), '.local', 'share', 'loka', 'bin', bin),
      join(homedir(), '.local', 'bin', bin),
      join(homedir(), '.cargo', 'bin', bin),
      '/usr/local/bin/' + bin,
      '/usr/bin/' + bin
    );
  }
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function findTool(bin) {
  const p = await which(bin);
  if (p) return p;
  return checkCommonPaths(bin);
}

function checkVendor(name) {
  const p = join(VENDOR, name);
  if (existsSync(p)) return p;
  return null;
}

async function findCaveman() {
  const v = checkVendor('caveman');
  if (v) return v;
  const claudeSkill = join(homedir(), '.claude', 'skills', 'caveman');
  if (existsSync(claudeSkill)) return claudeSkill;
  return findTool('skills');
}

const TOOLS = [
  {
    name: 'rtk',
    bin: 'rtk',
    find: async () => {
      const v = checkVendor('rtk');
      if (v) return v;
      return findTool('rtk');
    },
    install: {
      linux: ['sh', ['-c', 'curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh']],
      darwin: ['sh', ['-c', 'curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh']],
      win32: null
    }
  },
  {
    name: 'headroom',
    bin: 'headroom',
    find: async () => {
      const v = checkVendor('headroom');
      if (v) return v;
      return findTool('headroom');
    },
    install: {
      linux: ['npm', ['install', '-g', 'headroom-ai']],
      darwin: ['npm', ['install', '-g', 'headroom-ai']],
      win32: ['npm', ['install', '-g', 'headroom-ai']]
    }
  },
  {
    name: 'caveman',
    bin: 'skills',
    find: findCaveman,
    install: {
      linux: ['npx', ['-y', 'skills', 'add', 'JuliusBrussee/caveman', '-g']],
      darwin: ['npx', ['-y', 'skills', 'add', 'JuliusBrussee/caveman', '-g']],
      win32: ['npx', ['-y', 'skills', 'add', 'JuliusBrussee/caveman', '-g']]
    }
  }
];

export async function autoInstallMissingTools() {
  const p = platform();
  const missing = [];

  for (const t of TOOLS) {
    const found = t.find ? await t.find() : await findTool(t.bin);
    if (!found) missing.push(t);
  }

  if (missing.length === 0) return;

  console.log('Token Saver - tools belum terpasang:');
  for (const t of missing) {
    const spec = t.install[p];
    if (!spec) {
      console.log('  o ' + t.name + '  belum didukung di ' + p + ', install manual');
      continue;
    }
    console.log('  > ' + t.name + '  installing...');
    try {
      const [cmd, args] = spec;
      await runCmd(cmd, args);
      console.log('    ' + t.name + '  OK');
    } catch (e) {
      console.log('    ' + t.name + '  gagal: ' + (e.message || 'unknown'));
    }
  }
  console.log('');
}

export function getVendorPath(name) {
  return checkVendor(name);
}
