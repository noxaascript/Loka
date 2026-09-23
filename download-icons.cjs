const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(process.cwd(), 'lib', 'ui', 'icons');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

// Mapping: nama file lokal -> array URL sumber (coba satu-satu)
const LOGOS = {
  'openai': ['https://cdn.simpleicons.org/openai'],
  'anthropic': ['https://cdn.simpleicons.org/anthropic'],
  'claude': ['https://cdn.simpleicons.org/claude'],
  'gemini': ['https://svgl.app/library/gemini.svg', 'https://cdn.simpleicons.org/googlegemini'],
  'google': ['https://cdn.simpleicons.org/google'],
  'groq': ['https://cdn.simpleicons.org/groq'],
  'githubcopilot': ['https://cdn.simpleicons.org/githubcopilot'],
  'github': ['https://cdn.simpleicons.org/github'],
  'x': ['https://cdn.simpleicons.org/x'],
  'ollama': ['https://cdn.simpleicons.org/ollama'],
  'openrouter': ['https://cdn.simpleicons.org/openrouter'],
  'mistral': ['https://cdn.simpleicons.org/mistralai'],
  'deepseek': ['https://cdn.simpleicons.org/deepseek'],
  'together': ['https://cdn.simpleicons.org/together'],
  'fireworks': ['https://cdn.simpleicons.org/fireworks'],
  'perplexity': ['https://cdn.simpleicons.org/perplexity'],
  'cerebras': ['https://cdn.simpleicons.org/cerebras'],
  'moonshot': ['https://cdn.simpleicons.org/moonshot'],
  'kilocode': ['https://cdn.simpleicons.org/kilocode'],
  'cursor': ['https://cdn.simpleicons.org/cursor'],
  'cline': ['https://cdn.simpleicons.org/cline'],
  'xiaomi': ['https://cdn.simpleicons.org/xiaomi'],
  'huggingface': ['https://cdn.simpleicons.org/huggingface'],
  'novita': ['https://cdn.simpleicons.org/novita'],
  'cloudflare': ['https://cdn.simpleicons.org/cloudflare'],
  'cohere': ['https://cdn.simpleicons.org/cohere'],
  'sambanova': ['https://cdn.simpleicons.org/sambanova'],
  'alibabacloud': ['https://cdn.simpleicons.org/alibabacloud'],
  'tencentqq': ['https://cdn.simpleicons.org/tencentqq'],
  'opencode': ['https://cdn.simpleicons.org/opencode']
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
  for (const [name, urls] of Object.entries(LOGOS)) {
    const out = path.join(DIR, name + '.svg');
    if (fs.existsSync(out) && fs.statSync(out).size > 100) {
      console.log('SKIP ' + name);
      ok++;
      continue;
    }
    let saved = false;
    for (const url of urls) {
      try {
        const data = await fetch(url);
        fs.writeFileSync(out, data);
        console.log('OK   ' + name + ' <- ' + url);
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
  console.log('Tersimpan di: ' + DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
