import { appendFileSync, existsSync, mkdirSync, statSync, renameSync } from 'fs';
import { dirname } from 'path';

const LOG_FILE = './data/logs.ndjson';
const MAX_SIZE = 5 * 1024 * 1024;
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
let currentLevel = 'info';

export function setLogLevel(lvl) { currentLevel = lvl; }

function ensureFile() {
  const dir = dirname(LOG_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (existsSync(LOG_FILE) && statSync(LOG_FILE).size > MAX_SIZE) {
    renameSync(LOG_FILE, LOG_FILE + '.' + Date.now());
  }
}

function write(level, msg, meta = {}) {
  if (LEVELS[level] < LEVELS[currentLevel]) return;
  const entry = { ts: new Date().toISOString(), level, msg, ...meta };
  const color = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' }[level];
  const keys = Object.keys(meta);
  console.log(`${color}[${level}]\x1b[0m ${msg}`, keys.length ? meta : '');
  ensureFile();
  try { appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n'); } catch {}
}

export const log = {
  debug: (m, x) => write('debug', m, x),
  info: (m, x) => write('info', m, x),
  warn: (m, x) => write('warn', m, x),
  error: (m, x) => write('error', m, x)
};
