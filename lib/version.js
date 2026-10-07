import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const LOKA_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

let _cache = null;

function readPackage() {
  const raw = readFileSync(join(LOKA_DIR, 'package.json'), 'utf8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

export function getVersion() {
  if (_cache) return _cache;

  let pkgVersion = 'unknown';
  try {
    const pkg = readPackage();
    pkgVersion = pkg.version;
  } catch {}

  // Short version untuk sidebar: v20260926.fd08b17
  // Format: 0.0.0-[tag].[date].[commit gh]
  const parts = pkgVersion.split('.');
  const date = (parts.find(p => /^\d{8}$/.test(p))) || parts[parts.length - 2] || 'x';
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