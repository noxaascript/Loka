const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(process.cwd(), 'dist', 'binaries');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const BINARIES = [
  { name: 'cloudflared-windows-amd64.exe', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' },
  { name: 'cloudflared-windows-arm64.exe', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-arm64.exe' },
  { name: 'cloudflared-darwin-amd64', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz' },
  { name: 'cloudflared-darwin-arm64', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz' },
  { name: 'cloudflared-linux-amd64', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64' },
  { name: 'cloudflared-linux-arm64', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64' },
  { name: 'cloudflared-linux-arm', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm' },
  { name: 'cloudflared-linux-386', url: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386' }
];

function download(url, dest, depth) {
  if (depth > 5) return Promise.reject(new Error('Terlalu banyak redirect'));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Loka' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        return download(res.headers.location, dest, (depth || 0) + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  let ok = 0, skip = 0, fail = 0;
  for (const b of BINARIES) {
    const dest = path.join(DIR, b.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000000) {
      console.log('SKIP ' + b.name);
      skip++;
      continue;
    }
    try {
      console.log('DL   ' + b.name + '...');
      await download(b.url, dest, 0);
      const mb = Math.round(fs.statSync(dest).size / 1024 / 1024);
      console.log('     OK ' + mb + ' MB');
      ok++;
    } catch (e) {
      console.log('     FAIL: ' + e.message);
      fail++;
    }
  }
  console.log('\nTotal: ' + ok + ' OK, ' + skip + ' skip, ' + fail + ' fail');
  console.log('Folder: ' + DIR);
}

run().catch(console.error);