import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DIR = join(homedir(), '.config', 'loka');
const FILE = join(DIR, 'tunnel-notify.json');

function ensure() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

export function list() {
  ensure();
  if (!existsSync(FILE)) return [];
  try { return JSON.parse(readFileSync(FILE, 'utf8')); }
  catch { return []; }
}

export function push(type, message, meta) {
  ensure();
  const item = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    type,
    message,
    meta: meta || {},
    createdAt: new Date().toISOString(),
    read: false
  };
  const all = list();
  all.unshift(item);
  writeFileSync(FILE, JSON.stringify(all.slice(0, 20), null, 2));
  return item;
}

export function unread() {
  return list().filter(n => !n.read);
}

export function markAllRead() {
  ensure();
  const all = list();
  for (const n of all) n.read = true;
  writeFileSync(FILE, JSON.stringify(all, null, 2));
}