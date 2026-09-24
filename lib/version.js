import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const LOKA_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

let _cache = null;

export function getVersion() {
  if (_cache) return _cache;

  let pkgVersion = 'unknown';
  try {
    const pkg = JSON.parse(readFileSync(join(LOKA_DIR, 'package.json'), 'utf8'));
    pkgVersion = pkg.version;
  } catch {}

  // Short version untuk sidebar: v20260923.684e122
  const parts = pkgVersion.split('.');
  const date = parts[parts.length - 2] || 'x';
  const hash = parts[parts.length - 1] || 'x';
  const short = 'v' + date + '.' + hash;

  _cache = {
    version: pkgVersion,
    short,
    display: pkgVersion
  };

  return _cache;
}

export function clearCache() {
  _cache = null;
}