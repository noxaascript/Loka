#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { randomBytes } from 'crypto';
import { networkInterfaces } from 'os';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

function log(msg) { console.log(msg); }
function ok(msg) { log(`${GREEN}${RESET} ${msg}`); }
function info(msg) { log(`${CYAN}?${RESET} ${msg}`); }
function warn(msg) { log(`${YELLOW}${RESET} ${msg}`); }
function err(msg) { log(`${RED}${RESET} ${msg}`); }

function generateKey() {
  const bytes = randomBytes(32);
  return 'sk-' + bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getLANIPs() {
  const nets = networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ iface: name, ip: net.address });
      }
    }
  }
  return ips;
}

log('');
log(`${BOLD} Loka AI Router  Setup${RESET}`);
log(`${DIM}${RESET}`);
log('');

// 1. Cek Node.js
log(`${BOLD}[1/4]${RESET} Checking Node.js...`);
try {
  const v = execSync('node --version', { encoding: 'utf8' }).trim();
  const major = parseInt(v.replace('v', '').split('.')[0], 10);
  if (major < 20) {
    err(`Node.js ${v} too old. Need v20+`);
    log(`Download: https://nodejs.org/`);
    process.exit(1);
  }
  ok(`Node.js ${v}`);
} catch {
  err('Node.js not found');
  log('Download: https://nodejs.org/');
  process.exit(1);
}

// 2. Cek folder data
log('');
log(`${BOLD}[2/4]${RESET} Preparing folders...`);
for (const dir of ['data', 'data/backups']) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
ok('data/, data/backups/');

// 3. Cek loka.json
log('');
log(`${BOLD}[3/4]${RESET} Checking config...`);
if (!existsSync('loka.json')) {
  warn('loka.json tidak ada  bikin default...');
  const cfg = {
    port: 1455,
    host: '0.0.0.0',
    cooldownMs: 60000,
    maxRetries: 2,
    requestTimeoutMs: 60000,
    logLevel: 'error',
    cache: { enabled: true, ttlMs: 300000, maxEntries: 500 },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 120 },
    rtk: { enabled: true, maxDiffLines: 200, maxGrepResults: 100 },
    clients: [{ name: 'default', key: generateKey(), tier: 'unlimited' }],
    combos: {},
    providers: [
      {
        id: 'openai-codex',
        type: 'openai-codex',
        baseUrl: 'https://chatgpt.com/backend-api/codex',
        apiKeys: ['oauth'],
        models: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4'],
        weight: 5,
        tags: ['oauth', 'smart'],
        status: 'pending'
      },
      {
        id: 'github-copilot',
        type: 'github-copilot',
        baseUrl: 'https://api.githubcopilot.com',
        apiKeys: ['oauth'],
        models: ['gpt-5', 'claude-sonnet-5'],
        weight: 8,
        tags: ['oauth', 'free'],
        status: 'pending'
      },
      {
        id: 'google-gemini-cli',
        type: 'google-gemini-cli',
        baseUrl: 'https://cloudcode-pa.googleapis.com',
        apiKeys: ['oauth'],
        models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
        weight: 10,
        tags: ['oauth', 'free'],
        status: 'pending'
      },
      {
        id: 'groq',
        type: 'openai',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKeys: ['gsk_GANTI_KEY_KAMU'],
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        weight: 20,
        tags: ['fast', 'apikey'],
        status: 'pending'
      }
    ]
  };
  writeFileSync('loka.json', JSON.stringify(cfg, null, 2));
  ok('loka.json dibuat dengan key random');
} else {
  const cfg = JSON.parse(readFileSync('loka.json', 'utf8'));
  if (!cfg.clients || !cfg.clients.length || !cfg.clients[0].key?.startsWith('sk-')) {
    cfg.clients = [{ name: 'default', key: generateKey(), tier: 'unlimited' }];
    writeFileSync('loka.json', JSON.stringify(cfg, null, 2));
    ok('API key di-generate ulang');
  } else {
    ok('loka.json OK');
  }
}

// 4. Info
log('');
log(`${BOLD}[4/4]${RESET} Ready!`);
log('');

const cfg = JSON.parse(readFileSync('loka.json', 'utf8'));
const port = cfg.port || 1455;
const key = cfg.clients?.[0]?.key || '-';

log(`${DIM}${RESET}`);
log(`${BOLD} Loka AI Router${RESET}`);
log(`${DIM}${RESET}`);
log(`  Local     : ${CYAN}http://localhost:${port}${RESET}`);
const ips = getLANIPs();
for (const { iface, ip } of ips) {
  log(`  LAN       : ${CYAN}http://${ip}:${port}${RESET} ${DIM}(${iface})${RESET}`);
}
log(`  Endpoint  : ${CYAN}http://localhost:${port}/v1${RESET}`);
log(`  API Key   : ${YELLOW}${key}${RESET}`);
log(`${DIM}${RESET}`);
log('');
log(`${DIM}Starting server...${RESET}`);
log('');

// 5. Start server
const child = spawn('node', ['index.js'], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code || 0));
process.on('SIGINT', () => { child.kill(); process.exit(0); });
