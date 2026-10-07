import { getConfig } from '../config.js';
import { uiIcon } from './navicons.js';
import { detectCLIs } from '../cli-detect.js';
const CLI_LOGOS = {
  'claude-code': 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/claudecode.svg',
  'codex': 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/codex.svg',
  'opencode': 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/opencode.svg',
  'gemini-cli': 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/gemini.svg'
};

function cliLogoHtml(cli) {
  const url = CLI_LOGOS[cli.id];
  const initial = cli.name.charAt(0).toUpperCase();
  const fallback = '<div style="display:none;background:' + cli.color + ';width:42px;height:42px;border-radius:10px;color:#fff;font-weight:700;font-size:1.15rem;align-items:center;justify-content:center" class="cli-fb">' + initial + '</div>';
  if (url) {
    return '<img src="' + url + '" alt="' + cli.name + '" style="width:42px;height:42px;object-fit:contain" onerror="this.style.display=&quot;none&quot;;this.nextElementSibling.style.display=&quot;flex&quot;">' + fallback;
  }
  return '<div style="background:' + cli.color + ';width:42px;height:42px;border-radius:10px;color:#fff;font-weight:700;font-size:1.15rem;display:flex;align-items:center;justify-content:center">' + initial + '</div>';
}


import { layout } from './layout.js';

export function renderCLI() {
  const cfg = getConfig();
  const clis = detectCLIs();
  const primaryKey = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '';

  const cards = clis.map(cli =>
    cli.installed ? renderInstalled(cli) : renderNotInstalled(cli)
  ).join('');

  const body = `
    <p class="muted">Connect CLI AI yang terinstall ke Loka. Pilih endpoint dan model sebelum configure.</p>

    <div class="cligrid">${cards}</div>

    <div id="cfgModal" class="cfg-overlay" style="display:none">
      <div class="cfg-modal">
        <button type="button" class="cfg-close" id="cfgClose" aria-label="Close">${uiIcon('close', 15)}</button>
        <h2 id="cfgTitle" style="margin:0 0 .25rem">Configure CLI</h2>
        <p class="muted" id="cfgSubtitle" style="font-size:.8rem;margin-bottom:1rem"></p>

        <div class="cfg-section">
          <label>Endpoint</label>
          <select id="cfgEndpoint"></select>
          <p class="dim" style="font-size:.7rem;margin:.35rem 0 0">URL tempat Loka listen. Pilih local kalau CLI di mesin yang sama.</p>
        </div>

        <div class="cfg-section">
          <label>Model Default</label>
          <select id="cfgModel"></select>
          <p class="dim" style="font-size:.7rem;margin:.35rem 0 0">Model yang dipakai kalau nggak specify.</p>
        </div>

        <div class="cfg-section">
          <label>Atau pakai Combo (opsional)</label>
          <select id="cfgCombo">
            <option value=""> Tidak pakai combo </option>
          </select>
          <p class="dim" style="font-size:.7rem;margin:.35rem 0 0">Combo = chain fallback otomatis. Kalau dipilih, override model di atas.</p>
        </div>

        <div id="cfgPreview" class="cfg-preview"></div>

        <div class="cfg-actions">
          <button type="button" class="ghost" id="cfgCancel">Cancel</button>
          <button type="button" class="primary" id="cfgApply">Apply Config</button>
        </div>
      </div>
    </div>


    <script>
      var AUTH = '${primaryKey}';
      var DETECT = null;
      var CURRENT_CLI = null;

      function copyCmd(id, text) {
        navigator.clipboard.writeText(text).then(function(){
          if (window.toast) window.toast('Command copied');
          var btn = document.getElementById('copy-' + id);
          if (btn) { var o = btn.textContent; btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = o; }, 1500); }
        });
      }

      async function openConfig(cliId) {
        if (!DETECT) {
          var r = await fetch('/api/cli/detect', { headers: { 'Authorization': 'Bearer ' + AUTH } });
          DETECT = await r.json();
        }
        var cli = DETECT.clis.find(function(c){ return c.id === cliId });
        if (!cli) return;

        CURRENT_CLI = cli;

        document.getElementById('cfgTitle').textContent = 'Configure ' + cli.name;
        document.getElementById('cfgSubtitle').textContent = cli.configPath;

        // Populate endpoints
        var ep = document.getElementById('cfgEndpoint');
        ep.innerHTML = DETECT.endpoints.map(function(e){
          return '<option value="' + e.id + '">' + e.label + '  ' + e.url + '</option>';
        }).join('');

        // Populate models
        var md = document.getElementById('cfgModel');
        var readyModels = DETECT.models.filter(function(m){ return m.status === 'ready' });
        var otherModels = DETECT.models.filter(function(m){ return m.status !== 'ready' });
        var html = '';
        if (readyModels.length) {
          html += '<optgroup label="Ready">';
          html += readyModels.map(function(m){ return '<option value="' + m.id + '">' + m.id + '</option>' }).join('');
          html += '</optgroup>';
        }
        if (otherModels.length) {
          html += '<optgroup label="Belum connected">';
          html += otherModels.map(function(m){ return '<option value="' + m.id + '">' + m.id + '</option>' }).join('');
          html += '</optgroup>';
        }
        md.innerHTML = html;

        // Populate combos
        var cb = document.getElementById('cfgCombo');
        cb.innerHTML = '<option value=""> Tidak pakai combo </option>' +
          DETECT.combos.map(function(c){
            return '<option value="' + c.id + '">' + c.id + ' (' + c.models.join('  ') + ')</option>';
          }).join('');

        updatePreview();
        document.getElementById('cfgModal').style.display = 'flex';
      }

      function updatePreview() {
        if (!DETECT || !CURRENT_CLI) return;
        var epId = document.getElementById('cfgEndpoint').value;
        var modelId = document.getElementById('cfgModel').value;
        var comboId = document.getElementById('cfgCombo').value;
        var ep = DETECT.endpoints.find(function(e){ return e.id === epId });

        var lines = [];
        lines.push('CLI    : ' + CURRENT_CLI.name);
        lines.push('File   : ' + CURRENT_CLI.configPath);
        lines.push('Endpoint: ' + (ep ? ep.url : '?'));
        if (comboId) lines.push('Combo  : ' + comboId + ' (override model)');
        else if (modelId) lines.push('Model  : ' + modelId);
        document.getElementById('cfgPreview').textContent = lines.join('\\n');
      }

      async function applyConfig() {
        var epId = document.getElementById('cfgEndpoint').value;
        var modelId = document.getElementById('cfgModel').value;
        var comboId = document.getElementById('cfgCombo').value;

        var r = await fetch('/api/cli/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AUTH },
          body: JSON.stringify({
            id: CURRENT_CLI.id,
            endpoint: epId,
            model: modelId || null,
            combo: comboId || null
          })
        });
        var d = await r.json();
        if (d.ok) {
          if (window.toast) window.toast('Config ditulis: ' + (d.path || ''));
          if (d.backup) console.log('Backup:', d.backup);
          setTimeout(function(){ location.reload(); }, 1200);
        } else {
          if (window.toast) window.toast('Failed: ' + (d.error || 'unknown'));
        }
      }

      async function resetCLI(id) {
        if (!window.dialog.confirm('Delete config Loka of CLI ini?')) return;
        var r = await fetch('/api/cli/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AUTH },
          body: JSON.stringify({ id: id })
        });
        var d = await r.json();
        if (d.ok) {
          if (window.toast) window.toast('Config dihapus');
          setTimeout(function(){ location.reload(); }, 800);
        }
      }

      document.addEventListener('DOMContentLoaded', function() {
        fetch('/api/cli/detect', { headers: { 'Authorization': 'Bearer ' + AUTH } })
          .then(function(r){ return r.json() })
          .then(function(d){ DETECT = d })
          .catch(function(){});

        document.getElementById('cfgClose').onclick = function(){ document.getElementById('cfgModal').style.display = 'none'; };
        document.getElementById('cfgCancel').onclick = function(){ document.getElementById('cfgModal').style.display = 'none'; };
        document.getElementById('cfgApply').onclick = applyConfig;
        document.getElementById('cfgEndpoint').onchange = updatePreview;
        document.getElementById('cfgModel').onchange = updatePreview;
        document.getElementById('cfgCombo').onchange = updatePreview;
      });
    </script>
  `;

  return layout('CLI Connector', body, { active: '/cli', subtitle: 'Detect installed CLI tools and point them here' });
}

function renderInstalled(cli) {
  const versionTag = cli.version
    ? '<span class="pill info">' + cli.version + '</span>'
    : '<span class="pill ok">installed</span>';

  const configStatus = cli.configured
    ? '<span class="pill ok">connected to Loka</span>'
    : cli.configExists
      ? '<span class="pill warn">config ada (belum Loka)</span>'
      : '<span class="pill dim">belum di-config</span>';

  return '<div class="clicard">' +
    '<div class="cliheader">' +
      cliLogoHtml(cli) +
      '<div style="flex:1;min-width:0">' +
        '<div class="cliname">' + cli.name + '</div>' +
        '<div class="clidesc">' + cli.description + '</div>' +
        '<div class="clipath">' + cli.path + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="clibody">' +
      '<div class="clirow"><span>Status</span><span>' + versionTag + '</span></div>' +
      '<div class="clirow"><span>Config</span><span>' + configStatus + '</span></div>' +
      '<div class="clirow"><span>File</span><span><code>' + cli.configPath + '</code></span></div>' +
    '</div>' +
    '<div class="cliactions">' +
      (cli.configured
        ? '<button type="button" class="ghost" onclick="resetCLI(\'' + cli.id + '\')">Reset Config</button>'
        : '<button type="button" class="primary" onclick="openConfig(\'' + cli.id + '\')">Configure for Loka</button>') +
    '</div>' +
  '</div>';
}

function renderNotInstalled(cli) {
  const cmd = cli.installCmd;
  return '<div class="clicard missing">' +
    '<div class="cliheader">' +
      cliLogoHtml(cli) +
      '<div style="flex:1;min-width:0">' +
        '<div class="cliname">' + cli.name + '</div>' +
        '<div class="clidesc">' + cli.description + '</div>' +
        '<div class="clipath" style="color:var(--err)">Belum terinstall di PATH</div>' +
      '</div>' +
    '</div>' +
    '<div class="installbox">' +
      '<div class="label">Install di PowerShell</div>' +
      '<pre>' + escapeHtml(cmd) + '</pre>' +
      '<div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">' +
        '<button type="button" class="copybtn" id="copy-' + cli.id + '" onclick="copyCmd(\'' + cli.id + '\', \'' + cmd.replace(/'/g, "\\'") + '\')">Copy command</button>' +
        '<a href="' + cli.docs + '" target="_blank" rel="noopener">Docs </a>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}