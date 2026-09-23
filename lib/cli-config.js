import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';

function backup(path) {
  if (!existsSync(path)) return;
  try {
    const bak = path + '.loka-backup-' + Date.now();
    copyFileSync(path, bak);
    return bak;
  } catch { return null; }
}

export function writeConfig(cli, opts) {
  const { baseUrl, apiKey, model, combo } = opts;

  // Backup config lama
  const bak = backup(cli.configPath);

  let result;
  if (cli.type === 'claude') result = writeClaude(cli.configPath, baseUrl, apiKey, model, combo);
  else if (cli.type === 'codex') result = writeCodex(cli.configPath, baseUrl, apiKey, model);
  else if (cli.type === 'opencode') result = writeOpencode(cli.configPath, baseUrl, apiKey, model, combo);
  else if (cli.type === 'gemini') result = writeGemini(cli.configPath, baseUrl, apiKey, model);
  else return { ok: false, error: 'Type ' + cli.type + ' belum didukung' };

  return { ...result, backup: bak };
}

function writeClaude(path, base, key, model, combo) {
  let cfg = {};
  if (existsSync(path)) {
    try { cfg = JSON.parse(readFileSync(path, 'utf8')); } catch { cfg = {}; }
  }
  cfg.env = cfg.env || {};
  cfg.env.ANTHROPIC_BASE_URL = base;
  cfg.env.ANTHROPIC_API_KEY = key;
  cfg.env.ANTHROPIC_AUTH_TOKEN = key;
  if (model) cfg.env.ANTHROPIC_MODEL = model;
  if (combo) cfg.env.ANTHROPIC_MODEL = combo; // combo bisa jadi "model" juga
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cfg, null, 2), 'utf8');
  return { ok: true, path };
}

function writeCodex(path, base, key, model) {
  let content = '';
  if (existsSync(path)) {
    content = readFileSync(path, 'utf8');
    content = content.replace(/\[model_providers\.loka\][\s\S]*?(?=\[|$)/g, '').trim();
  }
  content += '\n\n[model_providers.loka]\n';
  content += 'name = "Loka"\n';
  content += 'base_url = "' + base + '/v1"\n';
  content += 'env_key = "LOKA_API_KEY"\n';
  content += 'wire_api = "responses"\n';

  // Set default model
  content += '\nmodel = "' + (model || 'gpt-5.6-sol') + '"\n';
  content += 'model_provider = "loka"\n';

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.trim() + '\n', 'utf8');
  return { ok: true, path, note: 'Set env LOKA_API_KEY=' + key };
}

function writeOpencode(path, base, key, model, combo) {
  let cfg = { $schema: 'https://opencode.ai/config.json' };
  if (existsSync(path)) {
    try { cfg = JSON.parse(readFileSync(path, 'utf8')); } catch { cfg = { $schema: 'https://opencode.ai/config.json' }; }
  }
  cfg.provider = cfg.provider || {};
  cfg.provider.loka = {
    npm: '@ai-sdk/openai-compatible',
    name: 'Loka',
    options: { baseURL: base + '/v1', apiKey: key },
    models: {}
  };
  if (model) {
    cfg.provider.loka.models[model] = { name: model };
  }
  if (combo) {
    cfg.provider.loka.models[combo] = { name: 'Combo: ' + combo };
  }

  // Set default model
  if (model || combo) {
    cfg.model = 'loka/' + (combo || model);
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cfg, null, 2), 'utf8');
  return { ok: true, path };
}

function writeGemini(path, base, key, model) {
  let cfg = {};
  if (existsSync(path)) {
    try { cfg = JSON.parse(readFileSync(path, 'utf8')); } catch { cfg = {}; }
  }
  cfg.apiBase = base + '/v1';
  cfg.apiKey = key;
  if (model) cfg.model = model;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cfg, null, 2), 'utf8');
  return { ok: true, path };
}

export function resetConfig(cli) {
  const path = cli.configPath;
  if (!existsSync(path)) return { ok: true, note: 'Config tidak ada' };

  const bak = backup(path);

  if (cli.type === 'claude') {
    try {
      const cfg = JSON.parse(readFileSync(path, 'utf8'));
      if (cfg.env) {
        delete cfg.env.ANTHROPIC_BASE_URL;
        delete cfg.env.ANTHROPIC_API_KEY;
        delete cfg.env.ANTHROPIC_AUTH_TOKEN;
        delete cfg.env.ANTHROPIC_MODEL;
      }
      writeFileSync(path, JSON.stringify(cfg, null, 2), 'utf8');
      return { ok: true, path, backup: bak };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  if (cli.type === 'codex') {
    try {
      let c = readFileSync(path, 'utf8');
      c = c.replace(/\[model_providers\.loka\][\s\S]*?(?=\[|$)/g, '').trim();
      c = c.replace(/^model\s*=.*$/gm, '');
      c = c.replace(/^model_provider\s*=.*$/gm, '');
      writeFileSync(path, c + '\n', 'utf8');
      return { ok: true, path, backup: bak };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  if (cli.type === 'opencode') {
    try {
      const cfg = JSON.parse(readFileSync(path, 'utf8'));
      if (cfg.provider) delete cfg.provider.loka;
      if (cfg.model && cfg.model.startsWith('loka/')) delete cfg.model;
      writeFileSync(path, JSON.stringify(cfg, null, 2), 'utf8');
      return { ok: true, path, backup: bak };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  if (cli.type === 'gemini') {
    try {
      const cfg = JSON.parse(readFileSync(path, 'utf8'));
      delete cfg.apiBase;
      delete cfg.apiKey;
      delete cfg.model;
      writeFileSync(path, JSON.stringify(cfg, null, 2), 'utf8');
      return { ok: true, path, backup: bak };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  return { ok: false, error: 'Unsupported' };
}

const CLI_CONFIG_PATHS = {
  'claude-code': () => join(homedir(), '.claude', 'settings.json'),
  'codex': () => join(homedir(), '.codex', 'config.toml'),
  'opencode': () => join(homedir(), '.config', 'opencode', 'opencode.json'),
  'gemini-cli': () => join(homedir(), '.gemini', 'settings.json')
};

export function updateCLITunnelUrl(oldUrl, newUrl) {
  if (!oldUrl || !newUrl || oldUrl === newUrl) return [];
  const updated = [];
  for (const [name, getPath] of Object.entries(CLI_CONFIG_PATHS)) {
    const path = getPath();
    if (!existsSync(path)) continue;
    try {
      let content = readFileSync(path, 'utf8');
      if (!content.includes(oldUrl)) continue;
      content = content.split(oldUrl).join(newUrl);
      writeFileSync(path, content, 'utf8');
      updated.push(name);
      console.log('[cli-config] updated ' + name + ' with new tunnel URL');
    } catch (e) {
      console.log('[cli-config] failed ' + name + ': ' + e.message);
    }
  }
  return updated;
}
