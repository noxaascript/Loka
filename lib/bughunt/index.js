import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { setEnabled, installProcessHooks } from './collector.js';
import { getBughuntConfig, isEnabled } from './config-store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

export function initBughunt() {
  if (!isEnabled()) {
    setEnabled(false);
    return null;
  }

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const c = getBughuntConfig();

  setEnabled(true);
  installProcessHooks();

  try {
    writeFileSync(join(DATA_DIR, 'bughunt.access.txt'),
      'path: ' + c.path + '\n' +
      'key:  ' + c.devKey + '\n' +
      'url:  http://localhost:1455' + c.path + '?k=' + c.devKey + '\n' +
      'updated: ' + new Date().toISOString() + '\n');
  } catch (e) {
    console.error('[bughunt] write access file gagal:', e.message);
  }

  return { path: c.path, key: c.devKey, cfg: c };
}
