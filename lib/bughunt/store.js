import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data', 'bugs');
const INDEX_FILE = join(DATA_DIR, 'index.json');
const VALID_STATUS = new Set(['open', 'resolved', 'ignored']);

function ensure() { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); }

function readIndex() {
  ensure();
  try {
    if (!existsSync(INDEX_FILE)) return { bugs: {}, updatedAt: new Date().toISOString() };
    return JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
  } catch { return { bugs: {}, updatedAt: new Date().toISOString() }; }
}

function writeIndex(idx) {
  ensure();
  idx.updatedAt = new Date().toISOString();
  writeFileSync(INDEX_FILE, JSON.stringify(idx, null, 2));
}

function readBug(id) {
  const f = join(DATA_DIR, id + '.json');
  try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; }
}

function writeBug(id, bug) {
  ensure();
  writeFileSync(join(DATA_DIR, id + '.json'), JSON.stringify(bug, null, 2));
}

export function recordOccurrence(fp, entry) {
  const idx = readIndex();
  const now = Date.now();
  let bug = idx.bugs[fp];
  if (!bug) {
    bug = { fp, firstSeen: now, lastSeen: now, count: 0, sample: entry, status: 'open', tags: [] };
    idx.bugs[fp] = bug;
  }
  bug.count++;
  bug.lastSeen = now;
  writeIndex(idx);

  const detail = readBug(fp) || { fp, occurrences: [] };
  detail.occurrences.push({ ...entry, at: now });
  if (detail.occurrences.length > 200) detail.occurrences = detail.occurrences.slice(-200);
  writeBug(fp, detail);
  return bug;
}

export function listBugs() {
  const idx = readIndex();
  return Object.values(idx.bugs).sort((a, b) => b.lastSeen - a.lastSeen);
}

export function getBug(fp) {
  const idx = readIndex();
  const bug = idx.bugs[fp];
  if (!bug) return null;
  const detail = readBug(fp) || { fp, occurrences: [] };
  return { ...bug, occurrences: detail.occurrences };
}

export function setStatus(fp, status) {
  const idx = readIndex();
  if (!idx.bugs[fp]) return false;
  if (!VALID_STATUS.has(status)) return false;
  idx.bugs[fp].status = status;
  writeIndex(idx);
  return true;
}

export function deleteBug(fp) {
  const idx = readIndex();
  if (!idx.bugs[fp]) return false;
  delete idx.bugs[fp];
  writeIndex(idx);
  try { unlinkSync(join(DATA_DIR, fp + '.json')); } catch {}
  return true;
}

export function clearAll() {
  const idx = readIndex();
  idx.bugs = {};
  writeIndex(idx);
  try {
    for (const f of readdirSync(DATA_DIR)) {
      if (f.endsWith('.json') && f !== 'index.json') {
        try { unlinkSync(join(DATA_DIR, f)); } catch {}
      }
    }
  } catch {}
}

export function getStats() {
  const bugs = listBugs();
  return {
    total: bugs.length,
    open: bugs.filter(b => b.status === 'open').length,
    resolved: bugs.filter(b => b.status === 'resolved').length,
    ignored: bugs.filter(b => b.status === 'ignored').length,
    last24h: bugs.filter(b => b.lastSeen > Date.now() - 86400000).length
  };
}
