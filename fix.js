const fs = require('fs');
const p = 'lib/ui/providers.js';
let c = fs.readFileSync(p, 'utf8');
const lines = c.split(/\r?\n/);
const out = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  // Detect broken pattern: line is only "'" or "'  " (unclosed string)
  if (/^\s*'\s*$/.test(line)) {
    // Next line should be the var lh declaration
    const next = (lines[i+1] || '').trim();
    if (next.includes('var lh=')) {
      out.push("'  var lh=p.type===\"google-gemini-cli\";',");
      i += 2;
      continue;
    }
    // Skip empty broken line
    i++;
    continue;
  }
  // Detect line with var lh but no opening quote
  if (/^\s*var lh=p\.type==="google-gemini-cli";',\s*$/.test(line)) {
    out.push("'  var lh=p.type===\"google-gemini-cli\";',");
    i++;
    continue;
  }
  out.push(line);
  i++;
}
fs.writeFileSync(p, out.join('\n'), 'utf8');
console.log('Fixed, lines:', out.length);
