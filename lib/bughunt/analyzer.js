import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const LIB = join(ROOT, 'lib');

const RULES = [
  { id: 'cwd-usage', re: /process\.cwd\(\)/g, msg: 'process.cwd()  pakai __dirname untuk path modul', sev: 'warn' },
  { id: 'eval-usage', re: /\beval\s*\(|new Function\s*\(/g, msg: 'eval / new Function  risiko security', sev: 'err' },
  { id: 'empty-catch', re: /catch\s*\([^)]*\)\s*\{\s*\}/g, msg: 'empty catch block  error tidak di-log', sev: 'warn' },
  { id: 'console-log', re: /\bconsole\.(log|debug)\s*\(/g, msg: 'console.log/debug  pertimbangkan pakai logger', sev: 'info' },
  { id: 'await-in-for', re: /for\s*\([^)]+\)\s*\{[^}]*\bawait\b/g, msg: 'await di dalam for loop  pertimbangkan Promise.all', sev: 'info' }
];

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (f === 'node_modules' || f.startsWith('.')) continue;
      walk(p, out);
    } else if (f.endsWith('.js') || f.endsWith('.mjs')) {
      out.push(p);
    }
  }
  return out;
}

export function analyzeLib() {
  const files = walk(LIB);
  const findings = [];

  for (const file of files) {
    let src;
    try { src = readFileSync(file, 'utf8'); } catch { continue; }
    const rel = relative(ROOT, file).replace(/\\/g, '/');

    for (const rule of RULES) {
      const re = new RegExp(rule.re.source, 'g');
      let m;
      while ((m = re.exec(src)) !== null) {
        const line = src.slice(0, m.index).split('\n').length;
        findings.push({
          file: rel, line, rule: rule.id, severity: rule.sev,
          message: rule.msg, snippet: m[0].slice(0, 80)
        });
        if (findings.length > 500) return findings;
      }
    }
  }
  return findings;
}
