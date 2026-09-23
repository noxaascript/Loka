const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(process.cwd(), 'lib', 'ui', 'icons');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

// 11 provider yang gagal + sumber alternatif
const RETRY = {
  'openai': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/openai/default.svg',
    'https://cdn.simpleicons.org/openai'
  ],
  'groq': [
    'https://proicons.com/icon/264669.svg',
    'https://cdn.simpleicons.org/groq'
  ],
  'together': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/together/default.svg',
    'https://cdn.simpleicons.org/together'
  ],
  'fireworks': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/fireworks/default.svg',
    'https://cdn.simpleicons.org/fireworks'
  ],
  'cerebras': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/cerebras/default.svg',
    'https://cdn.simpleicons.org/cerebras'
  ],
  'moonshot': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/kimi/default.svg',
    'https://cdn.simpleicons.org/moonshot'
  ],
  'kilocode': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/kilocode/default.svg',
    'https://cdn.simpleicons.org/kilocode'
  ],
  'novita': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/novita/default.svg',
    'https://cdn.simpleicons.org/novita-ai'
  ],
  'cohere': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/aya-cohere/default.svg',
    'https://cdn.simpleicons.org/cohere'
  ],
  'sambanova': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/sambanova/default.svg',
    'https://cdn.simpleicons.org/sambanova'
  ],
  'tencentqq': [
    'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/tencent/default.svg',
    'https://cdn.simpleicons.org/tencentqq'
  ]
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 Loka' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  let ok = 0, fail = 0;
  for (const [name, urls] of Object.entries(RETRY)) {
    const out = path.join(DIR, name + '.svg');
    if (fs.existsSync(out) && fs.statSync(out).size > 100) {
      console.log('SKIP ' + name + ' (sudah ada)');
      ok++;
      continue;
    }
    let saved = false;
    for (const url of urls) {
      try {
        const data = await fetch(url);
        if (data.length < 100) throw new Error('file terlalu kecil (' + data.length + ' bytes)');
        fs.writeFileSync(out, data);
        console.log('OK   ' + name + ' <- ' + url.split('/').pop());
        saved = true;
        ok++;
        break;
      } catch (e) {
        console.log('  x  ' + url + '  ' + e.message);
      }
    }
    if (!saved) {
      console.log('FAIL ' + name);
      fail++;
    }
  }
  console.log('\nTotal: ' + ok + ' OK, ' + fail + ' FAIL');
}

run().catch(e => { console.error(e); process.exit(1); });
