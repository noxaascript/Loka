const fs = require('fs');
const path = require('path');
const os = require('os');

const home = os.homedir();
const found = [];

function scanDir(dir, depth, visited) {
  if (depth > 4) return;
  let realpath;
  try { realpath = fs.realpathSync(dir); } catch { return; }
  if (visited.has(realpath)) return;
  visited.add(realpath);

  let entries;
  try { entries = fs.readdirSync(dir); } catch { return; }

  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name === '$Recycle.Bin' || name === 'Windows' || name === 'Program Files' || name === 'Program Files (x86)' || name === 'AppData') continue;
    const full = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }

    if (stat.isDirectory()) {
      scanDir(full, depth + 1, visited);
    } else if (name === 'loka.json') {
      try {
        const c = JSON.parse(fs.readFileSync(full, 'utf8'));
        found.push({
          path: full,
          providers: (c.providers || []).length,
          combos: Object.keys(c.combos || {}).length,
          clients: (c.clients || []).length,
          size: stat.size,
          mtime: stat.mtime.toISOString()
        });
      } catch {}
    }
  }
}

console.log('Scanning...');
scanDir(home, 0, new Set());
scanDir('C:\\', 0, new Set());

found.sort((a, b) => b.providers - a.providers);

console.log('\n=== Semua loka.json ditemukan ===');
for (const f of found) {
  console.log('Providers: ' + String(f.providers).padStart(2) + ' | Combos: ' + f.combos + ' | Clients: ' + f.clients);
  console.log('  ' + f.path);
  console.log('  modified: ' + f.mtime);
  console.log('');
}

if (found.length) {
  console.log(' Config dengan provider terbanyak:');
  console.log('  ' + found[0].path + ' (' + found[0].providers + ' providers)');
}
