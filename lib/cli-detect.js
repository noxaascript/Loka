import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { platform } from 'os';
import { execSync } from 'child_process';

const AGENTS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Anthropic official CLI coding agent',
    bin: 'claude',
    type: 'claude',
    configFile: '.claude/settings.json',
    installCmd: 'irm https://claude.ai/install.ps1 | iex',
    installShell: 'curl -fsSL https://claude.ai/install.sh | bash',
    docs: 'https://docs.claude.com/en/docs/claude-code/setup',
    color: '#d97757'
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    description: 'OpenAI Codex terminal agent',
    bin: 'codex',
    type: 'codex',
    configFile: '.codex/config.toml',
    installCmd: 'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"',
    installShell: 'npm install -g @openai/codex',
    docs: 'https://github.com/openai/codex',
    color: '#10a37f'
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    description: 'Open source terminal coding agent',
    bin: 'opencode',
    type: 'opencode',
    configFile: '.config/opencode/opencode.json',
    installCmd: 'npm install -g opencode-ai',
    installShell: 'curl -fsSL https://opencode.ai/install | bash',
    docs: 'https://opencode.ai/docs',
    color: '#7c3aed'
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    description: 'Google Gemini terminal agent',
    bin: 'gemini',
    type: 'gemini',
    configFile: '.gemini/settings.json',
    installCmd: 'npm install -g @google/gemini-cli',
    installShell: 'npm install -g @google/gemini-cli',
    docs: 'https://github.com/google-gemini/gemini-cli',
    color: '#4285f4'
  }
];

function findBinary(binName) {
  const pathDirs = (process.env.PATH || '').split(platform() === 'win32' ? ';' : ':');
  for (const dir of pathDirs) {
    if (!dir || !existsSync(dir)) continue;
    const candidates = platform() === 'win32'
      ? [binName + '.exe', binName + '.cmd', binName + '.ps1', binName]
      : [binName];
    for (const c of candidates) {
      const full = join(dir, c);
      if (existsSync(full)) return full;
    }
  }
  return null;
}

function getVersion(binPath) {
  if (!binPath) return null;
  try {
    const cmd = '"' + binPath + '" --version';
    const out = execSync(cmd, { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] });
    return out.trim().split('\n')[0].slice(0, 60);
  } catch {
    return null;
  }
}

function detectCLIs() {
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  const results = [];

  for (const agent of AGENTS) {
    const binPath = findBinary(agent.bin);
    const configPath = join(homeDir, agent.configFile);

    results.push({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      installed: Boolean(binPath),
      path: binPath,
      version: getVersion(binPath),
      configPath,
      configExists: existsSync(configPath),
      configured: existsSync(configPath) ? checkConfigured(configPath, agent.type) : false,
      installCmd: agent.installCmd,
      installShell: agent.installShell,
      docs: agent.docs,
      color: agent.color
    });
  }

  return results;
}

function checkConfigured(configPath, type) {
  try {
    const content = readFileSync(configPath, 'utf8');
    if (type === 'claude') {
      const cfg = JSON.parse(content);
      return Boolean(cfg.env && cfg.env.ANTHROPIC_BASE_URL && cfg.env.ANTHROPIC_BASE_URL.includes('localhost'));
    }
    if (type === 'codex') {
      return content.includes('[model_providers.loka]');
    }
    if (type === 'opencode') {
      const cfg = JSON.parse(content);
      return Boolean(cfg.provider && cfg.provider.loka);
    }
    if (type === 'gemini') {
      return content.includes('localhost');
    }
    return false;
  } catch {
    return false;
  }
}

export { detectCLIs };