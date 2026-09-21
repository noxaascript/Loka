import { getConfig } from '../config.js';
import { getStats } from '../stats.js';
import { cooldownSnapshot } from '../scheduler.js';
import { supportsOAuth, loadToken } from '../oauth/index.js';
import { layout } from './layout.js';

const CDN = 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons';

const PROVIDER_LOGOS = {
  'openai': ['https://svgl.app/library/openai.svg', 'https://cdn.simpleicons.org/openai'],
  'openai-codex': ['https://svgl.app/library/openai.svg', 'https://cdn.simpleicons.org/openai', CDN + '/openai-color.svg', CDN + '/openai.svg'],
  'anthropic': ['https://cdn.simpleicons.org/anthropic', CDN + '/anthropic-color.svg', CDN + '/anthropic.svg'],
  'anthropic-oauth': ['https://cdn.simpleicons.org/anthropic', CDN + '/anthropic-color.svg', CDN + '/anthropic.svg'],
  'claude': ['https://cdn.simpleicons.org/claude', CDN + '/claude-color.svg', CDN + '/claude.svg'],
  'gemini': ['https://svgl.app/library/gemini.svg', 'https://cdn.simpleicons.org/googlegemini', CDN + '/gemini-color.svg', CDN + '/gemini.svg'],
  'google-gemini-cli': ['https://svgl.app/library/gemini.svg', 'https://cdn.simpleicons.org/googlegemini', CDN + '/gemini-color.svg', CDN + '/gemini.svg'],
  'antigravity': ['https://cdn.simpleicons.org/google', CDN + '/antigravity.svg'],
  'groq': ['https://svgl.app/library/groq.svg', 'https://cdn.simpleicons.org/groq', CDN + '/groq-color.svg', CDN + '/groq.svg'],
  'github-copilot': ['https://cdn.simpleicons.org/githubcopilot', CDN + '/githubcopilot.svg'],
  'xai': ['https://cdn.simpleicons.org/x', CDN + '/grok.svg'],
  'ollama': ['https://cdn.simpleicons.org/ollama', CDN + '/ollama.svg'],
  'openrouter': ['https://cdn.simpleicons.org/openrouter', CDN + '/openrouter.svg'],
  'mistral': ['https://svgl.app/library/mistral.svg', 'https://cdn.simpleicons.org/mistralai', CDN + '/mistral-color.svg', CDN + '/mistral.svg'],
  'deepseek': ['https://svgl.app/library/deepseek.svg', 'https://cdn.simpleicons.org/deepseek', CDN + '/deepseek-color.svg', CDN + '/deepseek.svg'],
  'together': ['https://cdn.simpleicons.org/together', CDN + '/togetherai.svg'],
  'fireworks': ['https://cdn.simpleicons.org/fireworks', CDN + '/fireworks.svg'],
  'perplexity': ['https://cdn.simpleicons.org/perplexity', CDN + '/perplexity.svg'],
  'cerebras': ['https://cdn.simpleicons.org/cerebras', CDN + '/cerebras.svg'],
  'kimi': ['https://cdn.simpleicons.org/moonshot', CDN + '/moonshot.svg'],
  'kilo': ['https://cdn.simpleicons.org/kilocode', CDN + '/kilocode.svg'],
  'cursor': ['https://cdn.simpleicons.org/cursor', CDN + '/cursor.svg'],
  'cline': ['https://cdn.simpleicons.org/cline', CDN + '/cline.svg'],
  'clinepass': ['https://cdn.simpleicons.org/cline', CDN + '/cline.svg'],
  'qoder': ['https://cdn.simpleicons.org/alibabacloud', CDN + '/qoder.svg'],
  'codebuddy': ['https://cdn.simpleicons.org/tencentqq', CDN + '/codebuddy.svg'],
  'mimo': ['https://cdn.simpleicons.org/xiaomi', CDN + '/xiaomimimo.svg'],
  'xkiro': ['https://svgl.app/library/openai.svg', 'https://cdn.simpleicons.org/openai'],
  'hyperbolic': ['https://cdn.simpleicons.org/huggingface', CDN + '/hyperbolic.svg'],
  'novita': ['https://cdn.simpleicons.org/novita', CDN + '/novita.svg']
};

const COLORS = {
  "openai": '#10a37f',
  "openai-codex": '#10a37f',
  "anthropic": '#d97757',
  "anthropic-oauth": '#d97757',
  "claude": '#d97757',
  "gemini": '#4285f4',
  "google-gemini-cli": '#4285f4',
  "antigravity": '#4285f4',
  "groq": '#f55036',
  "github-copilot": '#24292e',
  "xai": '#1d1d1f',
  "ollama": '#0a0a0a',
  "openrouter": '#6467f2',
  "mistral": '#ff7000',
  "deepseek": '#4d6bfe',
  "together": '#0f6fff',
  "fireworks": '#ff6b00',
  "perplexity": '#20808d',
  "cerebras": '#f55036',
  "kimi": '#1e40af',
  "kilo": '#9333ea',
  "cursor": '#0a0a0a',
  "qoder": '#ff6a00',
  "codebuddy": '#10b981',
  "cline": '#0ea5e9',
  "clinepass": '#0891b2',
  "mimo": '#ff6900',
  "hyperbolic": '#6f42c1',
  "novita": '#00c896',
  "xkiro": '#6366f1'
};



const KEY_URLS = {
  groq: 'https://console.groq.com/keys',
  xai: 'https://console.x.ai/team/default/api-keys',
  deepseek: 'https://platform.deepseek.com/api_keys',
  mistral: 'https://console.mistral.ai/api-keys/',
  openrouter: 'https://openrouter.ai/keys',
  together: 'https://api.together.ai/settings/api-keys',
  fireworks: 'https://app.fireworks.ai/api-keys',
  perplexity: 'https://www.perplexity.ai/settings/api',
  cerebras: 'https://cloud.cerebras.ai',
  hyperbolic: 'https://app.hyperbolic.ai/settings/api-keys',
  novita: 'https://novita.ai/settings/key-management',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  gemini: 'https://aistudio.google.com/apikey',
  xkiro: 'https://xkiro.com/dashboard/api/keys'
};

function logoUrl(p) { const arr = PROVIDER_LOGOS[p.id] || PROVIDER_LOGOS[p.type] || []; return arr[0] || null; }
function colorFor(p) { return COLORS[p.id] || COLORS[p.type] || '#0969da'; }
function keyUrlFor(p) { return KEY_URLS[p.id] || null; }

function maskKey(k) {
  const s = String(k);
  if (s.length < 12) return s.slice(0, 4) + '...';
  return s.slice(0, 8) + '...' + s.slice(-4);
}

function isRealKey(k) {
  const s = String(k);
  return !s.includes('GANTI_KEY') && s !== 'oauth' && s.trim() !== '';
}

function logoHtml(p, size) {
  const sz = size || 36;
  const urls = PROVIDER_LOGOS[p.id] || PROVIDER_LOGOS[p.type] || [];
  const color = colorFor(p);
  const label = (p.id || '?')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  const fbStyle = 'background:linear-gradient(135deg,' + color + ',' + color + 'cc);width:' + sz + 'px;height:' + sz + 'px;border-radius:10px;color:#fff;font-weight:700;font-size:' + Math.round(sz * 0.42) + 'px;align-items:center;justify-content:center;letter-spacing:.5px';
  const fb = '<div style="display:none;' + fbStyle + '">' + label + '</div>';

  if (!urls.length) {
    return '<div style="display:flex;' + fbStyle + '">' + label + '</div>';
  }

  const dataJson = JSON.stringify(urls).replace(/"/g, '&quot;');
  const img = '<img src="' + urls[0] + '" alt="' + p.id + '" class="provider-img" ' +
    'style="width:' + sz + 'px;height:' + sz + 'px;object-fit:contain" ' +
    'data-urls="' + dataJson + '" ' +
    'data-i="0" ' +
    'onerror="' +
      'var u=JSON.parse(this.dataset.urls);' +
      'var i=parseInt(this.dataset.i||\'0\',10)+1;' +
      'if(i<u.length){this.dataset.i=i;this.src=u[i];}' +
      'else{this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';}' +
    '">';

  return img + fb;
}

function pill(p, cd) {
  if (cd) return '<span class="pill warn">' + cd + 's</span>';
  if (p.status === 'ready') return '<span class="pill ok">ready</span>';
  if (p.status === 'error') return '<span class="pill err">error</span>';
  return '<span class="pill dim">pending</span>';
}

function card(p, cds) {
  return '<button type="button" class="pcard" data-pid="' + p.id + '">' +
    '<div class="pcard-logo">' + logoHtml(p, 40) + '</div>' +
    '<div class="pcard-name">' + p.id + '</div>' +
    '<div class="pcard-type">' + p.type + '</div>' +
    '<div>' + pill(p, cds[p.id]) + '</div>' +
    '</button>';
}

function buildData(cfg, stats) {
  const data = {};
  for (const p of cfg.providers) {
    const s = stats.providers[p.id] || { success: 0, fail: 0, tokens: 0, latencySum: 0 };
    const tok = supportsOAuth(p.type) ? loadToken(p.id) : null;
    const keys = (p.apiKeys || []).filter(isRealKey);
    data[p.id] = {
      id: p.id,
      type: p.type,
      baseUrl: p.baseUrl,
      weight: p.weight,
      tags: p.tags || [],
      status: p.status,
      connectedAt: p.connectedAt || null,
      lastError: p.lastError || null,
      apiKeyCount: keys.length,
      apiKeysListed: keys.map(maskKey),
      models: p.models,
      oauth: supportsOAuth(p.type),
      hasOAuthToken: Boolean(tok),
      email: p.email || null,
      apiKeyUrl: keyUrlFor(p),
      logo: logoUrl(p),
      color: colorFor(p),
      stats: {
        success: s.success,
        fail: s.fail,
        tokens: s.tokens || 0,
        avgLatency: s.success ? Math.round(s.latencySum / s.success) : 0
      }
    };
  }
  return data;
}

const CSS = '<style>' +
  '.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.85rem;margin-top:1rem}' +
  '.pcard{background:#fff;border:1px solid #e1e4e8;border-radius:12px;padding:1rem .75rem;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:.4rem;font-family:inherit;color:#1f2328;min-height:135px;justify-content:center;transition:all .15s}' +
  '.pcard:hover{border-color:#0969da;transform:translateY(-2px);box-shadow:0 6px 16px rgba(9,105,218,.1)}' +
  '.pcard-logo{display:flex;align-items:center;justify-content:center;height:44px}' +
  '.pcard-name{font-size:.85rem;font-weight:600;text-align:center;word-break:break-word;line-height:1.2}' +
  '.pcard-type{font-size:.65rem;color:#8b949e;text-transform:uppercase;letter-spacing:.05em}' +
  '.overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem}' +
  '.modal{background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;padding:1.5rem;position:relative}' +
  '.mclose{position:absolute;top:.75rem;right:.75rem;background:transparent;border:none;font-size:1.2rem;cursor:pointer}' +
  '.mrow{display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid #e1e4e8;font-size:.85rem;gap:1rem}' +
  '.mrow span:first-child{color:#656d76}' +
  '.mrow span:last-child{text-align:right;word-break:break-all}' +
  '.mh{font-size:.75rem;color:#656d76;text-transform:uppercase;letter-spacing:.06em;margin:1.25rem 0 .5rem;font-weight:600}' +
  '.btns{display:flex;gap:.5rem;margin-top:1.5rem;flex-wrap:wrap}' +
  '.btns button{flex:1;min-width:110px;padding:.55rem 1rem;border-radius:8px;border:1px solid #e1e4e8;background:#fff;cursor:pointer;font-family:inherit;font-size:.85rem;font-weight:500}' +
  '.btns button.primary{background:#0969da;color:#fff;border-color:#0969da}' +
  '.btns button.danger{background:#cf222e;color:#fff;border-color:#cf222e}' +
  '.mrow2{display:flex;align-items:center;gap:.5rem;margin:.35rem 0;padding:.35rem .5rem;background:#f6f8fa;border-radius:6px}' +
  '.mrow2 code{background:#fff;padding:.2rem .5rem;border-radius:5px;font-size:.8rem;flex-shrink:0;border:1px solid #e1e4e8}' +
  '.mrow2 .testbtn{padding:.25rem .6rem;font-size:.7rem;border:1px solid #e1e4e8;background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:500}' +
  '.mrow2 .mres{font-size:.7rem;color:#656d76;margin-left:.25rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.keyslist{margin:.5rem 0}' +
  '.keyrow{display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem;background:#f6f8fa;border-radius:6px;margin:.25rem 0}' +
  '.keyrow code{background:#fff;padding:.2rem .5rem;border-radius:5px;font-size:.75rem;flex:1;border:1px solid #e1e4e8;font-family:monospace}' +
  '.keyrow .keydel{padding:.15rem .5rem;font-size:.85rem;border:1px solid #e1e4e8;background:#fff;border-radius:5px;cursor:pointer;color:#cf222e}' +
  '.section-h{font-size:.8rem;color:#656d76;text-transform:uppercase;letter-spacing:.08em;margin:1.75rem 0 .75rem;font-weight:600;border-bottom:1px solid #e1e4e8;padding-bottom:.5rem}' +
  '</style>';

const CLIENT_JS = `
var P = {}, A = "";
try { P = JSON.parse(document.getElementById("pdata").textContent); } catch (e) {}
try { A = document.getElementById("authdata").textContent.trim(); } catch (e) {}
var timer = null;

function closeM() {
  document.getElementById("modal").style.display = "none";
  if (timer) { clearInterval(timer); timer = null; }
}

function makeLogo(p, size) {
  var wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  var fb = document.createElement("div");
  fb.style.background = p.color;
  fb.style.width = size + "px";
  fb.style.height = size + "px";
  fb.style.borderRadius = "10px";
  fb.style.color = "#fff";
  fb.style.fontWeight = "700";
  fb.style.fontSize = Math.round(size * 0.55) + "px";
  fb.style.alignItems = "center";
  fb.style.justifyContent = "center";
  fb.textContent = p.id.charAt(0).toUpperCase();
  if (p.logo) {
    var img = document.createElement("img");
    img.src = p.logo;
    img.style.width = size + "px";
    img.style.height = size + "px";
    img.style.objectFit = "contain";
    fb.style.display = "none";
    img.onerror = function () { img.style.display = "none"; fb.style.display = "flex"; };
    wrap.appendChild(img);
  } else {
    fb.style.display = "flex";
  }
  wrap.appendChild(fb);
  return wrap;
}

function openP(id) {
  var p = P[id];
  if (!p) { alert("not found: " + id); return; }
  var head = document.getElementById("mhead");
  head.innerHTML = "";
  var row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "0.85rem";
  row.style.alignItems = "center";
  row.style.marginBottom = "1rem";
  row.style.paddingRight = "2rem";
  row.appendChild(makeLogo(p, 42));
  var info = document.createElement("div");
  var title = document.createElement("h2");
  title.style.margin = "0";
  title.style.fontSize = "1.1rem";
  title.textContent = p.id;
  info.appendChild(title);
  var sub = document.createElement("div");
  sub.style.color = "#656d76";
  sub.style.fontSize = ".8rem";
  sub.style.marginTop = ".15rem";
  sub.innerHTML = "<code>" + p.type + "</code> - weight " + p.weight;
  info.appendChild(sub);
  row.appendChild(info);
  head.appendChild(row);

  var b = "";
  b += '<div class="mh">Account</div>';
  b += '<div class="mrow"><span>Method</span><span>' + (p.oauth ? "OAuth" : "API Key") + '</span></div>';
  if (p.oauth) b += '<div class="mrow"><span>OAuth Token</span><span>' + (p.hasOAuthToken ? "stored" : "none") + '</span></div>';
  if (p.email) b += '<div class="mrow"><span>Email</span><span>' + p.email + '</span></div>';
  b += '<div class="mrow"><span>API Keys</span><span>' + p.apiKeyCount + '</span></div>';
  if (p.apiKeyUrl) b += '<div class="mrow"><span>Get Key</span><span><a href="' + p.apiKeyUrl + '" target="_blank" rel="noopener" style="color:#0969da">Buka Console</a></span></div>';
  if (p.connectedAt) b += '<div class="mrow"><span>Connected</span><span>' + new Date(p.connectedAt).toLocaleString() + '</span></div>';
  if (p.lastError) b += '<div class="mrow"><span>Error</span><span style="color:#cf222e">' + p.lastError + '</span></div>';
  if (p.apiKeysListed && p.apiKeysListed.length) {
    b += '<div class="keyslist">';
    for (var ki = 0; ki < p.apiKeysListed.length; ki++) {
      b += '<div class="keyrow"><code>' + p.apiKeysListed[ki] + '</code><button type="button" class="keydel" data-idx="' + ki + '">x</button></div>';
    }
    b += '</div>';
  }
  b += '<div class="mh">Connection</div>';
  b += '<div class="mrow"><span>Base URL</span><span><code>' + p.baseUrl + '</code></span></div>';
  b += '<div class="mh">Stats</div>';
  b += '<div class="mrow"><span>OK / Fail</span><span>' + p.stats.success + ' / ' + p.stats.fail + '</span></div>';
  b += '<div class="mrow"><span>Avg</span><span>' + p.stats.avgLatency + 'ms</span></div>';
  b += '<div class="mrow"><span>Tokens</span><span>' + p.stats.tokens.toLocaleString() + '</span></div>';
  b += '<div class="mh">Models (' + p.models.length + ')</div>';
  b += '<div>' + p.models.map(function (m) {
    return '<div class="mrow2"><code>' + m + '</code><button type="button" class="testbtn" data-m="' + m + '">Test</button><span class="mres"></span></div>';
  }).join("") + '</div>';
  document.getElementById("mbody").innerHTML = b;

  var f = "";
  if (p.status === "ready") {
    f += '<button class="danger" id="b1">Disconnect</button>';
    f += '<button id="b2">Test</button>';
  } else if (p.oauth) {
    f += '<button class="primary" id="b1">Connect OAuth</button>';
    f += '<button id="b2">Use API Key</button>';
  } else {
    f += '<button class="primary" id="b1">Connect</button>';
  }
  if (!p.oauth) f += '<button class="ghost" id="bAdd">Add API Key</button>';
  if (!p.oauth && p.apiKeyCount > 0) f += '<button class="ghost" id="bImport">Import Models</button>';
  document.getElementById("mfoot").innerHTML = f;

  var b1 = document.getElementById("b1");
  if (b1) b1.onclick = function () { if (p.status === "ready") disconnectP(p.id); else if (p.oauth) startOAuth(p.id); else connectP(p.id); };
  var b2 = document.getElementById("b2");
  if (b2) b2.onclick = function () { if (p.status === "ready") testP(p.id); else connectP(p.id); };
  var bAdd = document.getElementById("bAdd");
  if (bAdd) bAdd.onclick = function () { addApiKey(p.id); };
  var bImport = document.getElementById("bImport");
  if (bImport) bImport.onclick = function () { importModels(p.id, bImport); };

  var kd = document.querySelectorAll(".keydel");
  for (var d = 0; d < kd.length; d++) {
    (function (btn) { btn.onclick = function () { removeApiKey(p.id, parseInt(btn.getAttribute("data-idx"))); }; })(kd[d]);
  }
  var tb = document.querySelectorAll(".testbtn");
  for (var k = 0; k < tb.length; k++) {
    (function (btn) {
      btn.onclick = function () {
        var m = btn.getAttribute("data-m");
        var r = btn.parentElement.querySelector(".mres");
        testModel(p.id, m, btn, r);
      };
    })(tb[k]);
  }

  document.getElementById("modal").style.display = "flex";
}

async function testModel(pid, model, btn, res) {
  btn.disabled = true;
  var old = btn.textContent;
  btn.textContent = "...";
  res.textContent = "";
  res.style.color = "#656d76";
  try {
    var r = await fetch("/api/test-model?id=" + pid + "&model=" + encodeURIComponent(model), { headers: { "Authorization": "Bearer " + A } });
    var d = await r.json();
    if (d.ok) {
      res.textContent = "OK " + d.latency + "ms";
      res.style.color = "#1a7f37";
      btn.style.borderColor = "#1a7f37";
      btn.style.background = "#dafbe1";
    } else {
      res.textContent = "FAIL: " + (d.error || "unknown").slice(0, 80);
      res.style.color = "#cf222e";
      btn.style.borderColor = "#cf222e";
      btn.style.background = "#ffebe9";
    }
  } catch (e) {
    res.textContent = "ERR: " + e.message;
    res.style.color = "#cf222e";
  }
  btn.disabled = false;
  btn.textContent = old;
}

async function addApiKey(pid) {
  var k = prompt("Masukkan API key untuk " + pid + ":");
  if (!k || !k.trim()) return;
  if (window.toast) window.toast("Menyimpan & test...");
  try {
    var r = await fetch("/api/add-api-key", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + A }, body: JSON.stringify({ providerId: pid, key: k.trim() }) });
    var d = await r.json();
    if (d.ok) {
      var msg = "API key disimpan (" + d.count + ")";
      if (d.test && d.test.ok) msg += " - Connected";
      else if (d.test && d.test.error) msg += " - Failed: " + String(d.test.error).slice(0, 60);
      if (window.toast) window.toast(msg);
      setTimeout(function () { closeM(); location.reload(); }, 1400);
    } else {
      if (window.toast) window.toast("Gagal: " + (d.error || "?"));
    }
  } catch (e) {
    if (window.toast) window.toast("Error: " + e.message);
  }
}

async function removeApiKey(pid, idx) {
  if (!confirm("Hapus API key ini?")) return;
  try {
    var r = await fetch("/api/remove-api-key", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + A }, body: JSON.stringify({ providerId: pid, index: idx }) });
    var d = await r.json();
    if (d.ok) {
      if (window.toast) window.toast("Key dihapus");
      setTimeout(function () { closeM(); location.reload(); }, 700);
    }
  } catch (e) {
    if (window.toast) window.toast("Error: " + e.message);
  }
}

async function connectP(id) {
  if (window.toast) window.toast("Connecting...");
  try {
    var r = await fetch("/api/connect-provider?id=" + id, { method: "POST", headers: { "Authorization": "Bearer " + A } });
    var d = await r.json();
    if (window.toast) window.toast(d.ok ? "Connected" : "Failed: " + (d.error || "?"));
    if (d.ok) setTimeout(function () { location.reload(); }, 900);
  } catch (e) { if (window.toast) window.toast("Error: " + e.message); }
}

async function disconnectP(id) {
  if (!confirm("Disconnect " + id + "?")) return;
  await fetch("/api/disconnect-provider?id=" + id, { method: "POST", headers: { "Authorization": "Bearer " + A } });
  setTimeout(function () { location.reload(); }, 500);
}

async function testP(id) {
  if (window.toast) window.toast("Testing...");
  try {
    var r = await fetch("/api/test-provider?id=" + id, { headers: { "Authorization": "Bearer " + A } });
    var d = await r.json();
    if (window.toast) window.toast(d.ok ? "OK (" + d.latency + "ms)" : "Fail: " + (d.error || "?"));
  } catch (e) { if (window.toast) window.toast("Error: " + e.message); }
}

async function startOAuth(id) {
  var p = P[id];
  if (!p) return;
  document.getElementById("mbody").innerHTML = '<p class="muted">Preparing...</p>';
  document.getElementById("mfoot").innerHTML = "";
  try {
    var r = await fetch("/api/oauth/start?id=" + id, { headers: { "Authorization": "Bearer " + A } });
    var d = await r.json();
    if (!d.ok) throw new Error(d.error || "Failed");
    document.getElementById("mbody").innerHTML = '<p class="muted">Copy code:</p><div style="background:#f6f8fa;padding:1rem;border-radius:8px;text-align:center;font-size:1.5rem;font-weight:700;font-family:monospace;margin:.5rem 0">' + d.userCode + '</div><a href="' + d.verificationUri + '" target="_blank" style="display:block;background:#0969da;color:#fff;padding:.7rem;border-radius:8px;text-align:center;text-decoration:none">Open Login Page</a><div id="ps" style="margin-top:1rem;padding:.75rem;background:#fff8c5;border-radius:8px;font-size:.8rem;color:#9a6700">Waiting...</div>';
    setTimeout(function () { window.open(d.verificationUri, "_blank"); }, 300);
    timer = setInterval(async function () {
      try {
        var pr = await fetch("/api/oauth/poll?device_code=" + encodeURIComponent(d.deviceCode), { headers: { "Authorization": "Bearer " + A } });
        var pd = await pr.json();
        if (pd.status === "success") {
          clearInterval(timer);
          document.getElementById("ps").textContent = "Connected!";
          setTimeout(function () { closeM(); location.reload(); }, 900);
        }
      } catch (e) {}
    }, (d.interval || 5) * 1000);
  } catch (e) {
    document.getElementById("mbody").innerHTML = '<div style="color:#cf222e">Error: ' + e.message + '</div>';
  }
}

async function importModels(pid, btn) {
  btn.disabled = true;
  var old = btn.textContent;
  btn.textContent = 'Loading...';
  if (window.toast) window.toast('Fetching models dari ' + pid + '...');
  try {
    var r = await fetch('/api/import-models?id=' + pid, { headers: { 'Authorization': 'Bearer ' + A } });
    var d = await r.json();
    if (d.ok) {
      if (window.toast) window.toast('Berhasil import ' + d.count + ' model');
      setTimeout(function () { closeM(); location.reload(); }, 1200);
    } else {
      if (window.toast) window.toast('Gagal: ' + (d.error || 'unknown'));
      btn.disabled = false;
      btn.textContent = old;
    }
  } catch (e) {
    if (window.toast) window.toast('Error: ' + e.message);
    btn.disabled = false;
    btn.textContent = old;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  var cs = document.querySelectorAll(".pcard");
  for (var i = 0; i < cs.length; i++) {
    (function (b) { b.onclick = function () { openP(b.getAttribute("data-pid")); }; })(cs[i]);
  }
  var mc = document.getElementById("mclose");
  if (mc) mc.onclick = closeM;
  var ov = document.getElementById("modal");
  if (ov) ov.addEventListener("click", function (e) { if (e.target === ov) closeM(); });
});
`;

export function renderProviders() {
  const cfg = getConfig();
  const stats = getStats();
  const cds = cooldownSnapshot();
  const KEY = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '';

  const oauthList = cfg.providers.filter(p => supportsOAuth(p.type));
  const regList = cfg.providers.filter(p => !supportsOAuth(p.type));

  const oauthCards = oauthList.map(p => card(p, cds)).join('');
  const regCards = regList.map(p => card(p, cds)).join('');

  const data = buildData(cfg, stats);
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const auth = String(KEY).replace(/</g, '\\u003c');

  const html = '<p class="muted">Klik provider untuk lihat detail dan connect.</p>' +
    '<div class="section-h">OAuth Providers (' + oauthList.length + ')</div>' +
    (oauthCards ? '<div class="pgrid">' + oauthCards + '</div>' : '<p class="dim">Belum ada provider OAuth.</p>') +
    '<script id="pdata" type="application/json">' + json + '</script>' +
    '<script id="authdata" type="text/plain">' + auth + '</script>' +
    '<div id="modal" class="overlay" style="display:none"><div class="modal">' +
    '<button class="mclose" id="mclose">x</button>' +
    '<div id="mhead"></div><div id="mbody"></div><div id="mfoot" class="btns"></div>' +
    '</div></div>' + CSS +
    '<script>' + CLIENT_JS + '<\/script>';

  return layout('Providers', html, { active: '/providers' });
}