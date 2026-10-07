import { layout } from './layout.js';

export function renderTokenSaver() {
  const body = `
    <p class="dim" style="margin-bottom:1.5rem">
      3 tools kompresi token. Configure untuk atur mode & status.
    </p>

<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">

      <div class="card" data-tool="server" style="border:1px solid var(--line)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.75rem">
          <div>
            <h3 style="margin:0">Server Auto Saver</h3>
            <p class="dim" style="margin:.2rem 0 0;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em">Built-in · tiap request</p>
          </div>
          <span class="pill dim" data-status-server>checking...</span>
        </div>
        <p class="muted" style="font-size:.82rem;line-height:1.5">
          Kompak history panjang otomatis di server (chat + stream). Tanpa install apapun,
          hemat <strong>50%+</strong> token di thread panjang.
        </p>
        <p class="dim" data-source-server style="font-size:.7rem;margin-top:.5rem;display:none"></p>
        <div style="display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap">
          <button class="sm" onclick="configureServer()">Configure</button>
        </div>
      </div>

      <div class="card" data-tool="rtk">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.75rem">
          <div>
            <h3 style="margin:0">RTK</h3>
            <p class="dim" style="margin:.2rem 0 0;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em">Rust Token Killer</p>
          </div>
          <span class="pill dim" data-status>checking...</span>
        </div>
        <p class="muted" style="font-size:.82rem;line-height:1.5">
          Compress command output (git diff, grep, ls, gh) before entering the LLM.
          Hemat <strong>60-90%</strong> token.
        </p>
        <p class="dim" data-source style="font-size:.7rem;margin-top:.5rem;display:none"></p>
        <div style="display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap">
          <button class="sm" data-btn-install onclick="installTool('rtk')" style="display:none">Install</button>
          <button class="sm ghost" onclick="configureTool('rtk')">Configure</button>
        </div>
      </div>

      <div class="card" data-tool="headroom">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.75rem">
          <div>
            <h3 style="margin:0">Headroom</h3>
            <p class="dim" style="margin:.2rem 0 0;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em">Context Compressor</p>
          </div>
          <span class="pill dim" data-status>checking...</span>
        </div>
        <p class="muted" style="font-size:.82rem;line-height:1.5">
          Compress entire context (tool output, logs, history). Reversible.
          <strong>60-95%</strong> for JSON.
        </p>
        <p class="dim" data-source style="font-size:.7rem;margin-top:.5rem;display:none"></p>
        <div style="display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap">
          <button class="sm" data-btn-install onclick="installTool('headroom')" style="display:none">Install</button>
          <button class="sm ghost" onclick="configureTool('headroom')">Configure</button>
        </div>
      </div>

      <div class="card" data-tool="caveman">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.75rem">
          <div>
            <h3 style="margin:0">Caveman</h3>
            <p class="dim" style="margin:.2rem 0 0;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em">Output + Context Compressor</p>
          </div>
          <span class="pill dim" data-status>checking...</span>
        </div>
        <p class="muted" style="font-size:.82rem;line-height:1.5">
          Kompres output prose + context. Mode lite / full / ultra.
          Hemat hingga <strong>65%</strong> output token.
        </p>
        <p class="dim" data-source style="font-size:.7rem;margin-top:.5rem;display:none"></p>
        <div style="display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap">
          <button class="sm" data-btn-install onclick="installTool('caveman')" style="display:none">Install</button>
          <button class="sm ghost" onclick="configureTool('caveman')">Configure</button>
        </div>
      </div>

    </div>

    <h2 style="margin-top:2rem">Total Savings</h2>
    <div class="stats-grid">
      <div class="stat">
        <div class="label">Tokens saved</div>
        <div class="value" id="stat-token">0</div>
        <div class="sub" id="stat-token-sub">of 0 total</div>
      </div>
      <div class="stat">
        <div class="label">Cost saved</div>
        <div class="value" id="stat-cost">$0.00</div>
        <div class="sub">estimated USD</div>
      </div>
      <div class="stat">
        <div class="label">Average compression</div>
        <div class="value" id="stat-pct">0%</div>
        <div class="sub">last 30 days</div>
      </div>
    </div>

    <div class="loka-dialog-overlay" id="cfgOverlay" style="display:none">
      <div class="loka-dialog" style="max-width:480px">
        <div class="loka-dialog-icon" id="cfgIcon">&#9881;</div>
        <h3 id="cfgTitle">Configure</h3>
        <p class="dim" id="cfgSubtitle" style="font-size:.78rem;margin-bottom:1rem"></p>
        <div id="cfgBody"></div>
        <div class="loka-dialog-actions" style="margin-top:1.35rem">
          <button class="ghost" onclick="closeCfg()">Cancel</button>
          <button onclick="saveCfg()">Save</button>
        </div>
      </div>
    </div>

    <script>
      var LOKA_AUTH = (typeof LOKA_KEY !== 'undefined' && LOKA_KEY) ? LOKA_KEY : 'loka-local';
      var CURRENT_CFG = { tokenSaver: { rtk: {}, headroom: {}, caveman: {} } };
      var CURRENT_TOOL = null;

      function setStatus(tool, status, label, source) {
        var card = document.querySelector('[data-tool="' + tool + '"]');
        if (!card) return;
        var pill = card.querySelector('[data-status]');
        var btnInstall = card.querySelector('[data-btn-install]');
        var sourceEl = card.querySelector('[data-source]');
        if (pill) { pill.className = 'pill ' + status; pill.textContent = label; }
        if (btnInstall) btnInstall.style.display = (status === 'ok') ? 'none' : '';
        if (sourceEl) {
          if (source && status === 'ok') {
            sourceEl.textContent = 'source: ' + source;
            sourceEl.style.display = '';
          } else {
            sourceEl.style.display = 'none';
          }
        }
      }

      async function checkTools() {
        try {
          var r = await fetch('/api/token-saver/status', {
            headers: { 'Authorization': 'Bearer ' + LOKA_AUTH }
          });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          var d = await r.json();
          ['rtk', 'headroom', 'caveman'].forEach(function(t) {
            var s = d[t] || {};
            if (s.installed) setStatus(t, 'ok', 'active', s.source);
            else setStatus(t, 'dim', 'not installed', null);
          });
if (d.stats) {
            document.getElementById('stat-token').textContent = (d.stats.savedTokens || 0).toLocaleString();
            document.getElementById('stat-token-sub').textContent = 'of ' + (d.stats.totalTokens || 0).toLocaleString() + ' total';
            document.getElementById('stat-cost').textContent = '$' + (d.stats.savedCost || 0).toFixed(2);
            var pct = d.stats.totalTokens ? Math.round(d.stats.savedTokens / d.stats.totalTokens * 100) : 0;
            document.getElementById('stat-pct').textContent = pct + '%';
          }
          if (d.server) {
            var sp = document.querySelector('[data-status-server]');
            var src = document.querySelector('[data-source-server]');
            if (sp) {
              sp.className = 'pill ' + (d.server.enabled && d.server.compactHistory ? 'ok' : 'dim');
              sp.textContent = (d.server.enabled && d.server.compactHistory) ? 'on' : 'off';
            }
            if (src) {
              src.textContent =
                'budget ' + (d.server.maxTokensEst || 8000) + ' tok · keep ' + (d.server.keepRecent || 8) +
                ' · summarize ' + (d.server.summarizeOld ? 'on' : 'off') +
                ' · rtk compressor ' + (d.server.enabled ? 'on' : 'off');
              src.style.display = '';
            }
          }
        } catch (e) {
          ['rtk', 'headroom', 'caveman'].forEach(function(t) { setStatus(t, 'err', 'error', null); });
        }
      }

      async function loadCfg() {
        try {
          var r = await fetch('/api/token-saver/config', {
            headers: { 'Authorization': 'Bearer ' + LOKA_AUTH }
          });
          var d = await r.json();
          if (d.ok && d.tokenSaver) CURRENT_CFG = { tokenSaver: d.tokenSaver };
        } catch {}
      }

      function row(label, control) {
        return '<div style="margin-bottom:.85rem">' +
          '<label style="margin-bottom:.25rem;display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-2)">' + label + '</label>' +
          control + '</div>';
      }

      function toggle(id, checked) {
        return '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + ' style="width:auto;display:inline-block">';
      }

      async function configureTool(tool) {
        await loadCfg();
        CURRENT_TOOL = tool;
        var cfg = (CURRENT_CFG.tokenSaver && CURRENT_CFG.tokenSaver[tool]) || {};
        var t = document.getElementById('cfgTitle');
        var sub = document.getElementById('cfgSubtitle');
        var icon = document.getElementById('cfgIcon');
        var body = document.getElementById('cfgBody');

        if (tool === 'rtk') {
          t.textContent = 'Configure RTK';
          sub.textContent = 'Sumber: Rust Token Killer binary';
          icon.innerHTML = '&#128295;';
          body.innerHTML =
            row('Status', '<label style="display:flex;align-items:center;gap:.5rem;font-weight:400;text-transform:none">' + toggle('cfg_rtk_enabled', !!cfg.enabled) + ' Enable RTK compression</label>') +
            row('Mode', '<label style="display:flex;align-items:center;gap:.5rem;font-weight:400;text-transform:none">' + toggle('cfg_rtk_ultra', !!cfg.ultraCompact) + ' Ultra compact (-u flag)</label>');
        } else if (tool === 'headroom') {
          t.textContent = 'Configure Headroom';
          sub.textContent = 'JS library, requires running proxy';
          icon.innerHTML = '&#129504;';
          body.innerHTML =
            row('Status', '<label style="display:flex;align-items:center;gap:.5rem;font-weight:400;text-transform:none">' + toggle('cfg_hr_enabled', !!cfg.enabled) + ' Enable Headroom compression</label>') +
            row('Proxy URL', '<input type="text" id="cfg_hr_url" value="' + (cfg.proxyUrl || 'http://localhost:8787') + '">');
        } else if (tool === 'caveman') {
          t.textContent = 'Configure Caveman';
          sub.textContent = 'Output + Context compressor';
          icon.innerHTML = '&#129702;';
          var modes = ['lite', 'full', 'ultra'];
          var opts = modes.map(function(m) {
            return '<option value="' + m + '"' + (cfg.mode === m ? ' selected' : '') + '>' + m + '</option>';
          }).join('');
          var thinkModes = ['compress', 'record', 'pixel'];
          var tOpts = thinkModes.map(function(m) {
            return '<option value="' + m + '"' + (cfg.thinkMode === m ? ' selected' : '') + '>' + m + '</option>';
          }).join('');
          body.innerHTML =
            row('Status', '<label style="display:flex;align-items:center;gap:.5rem;font-weight:400;text-transform:none">' + toggle('cfg_cm_enabled', !!cfg.enabled) + ' Enable Caveman</label>') +
            row('Output mode (skill)', '<select id="cfg_cm_mode">' + opts + '</select>') +
            row('Think mode (proxy)', '<select id="cfg_cm_think">' + tOpts + '</select>');
        }

        document.getElementById('cfgOverlay').style.display = 'flex';
      }

      function closeCfg() {
        document.getElementById('cfgOverlay').style.display = 'none';
        CURRENT_TOOL = null;
      }

async function saveCfg() {
        if (!CURRENT_TOOL) return;
        if (CURRENT_TOOL === 'server') return saveServer();
        var values = {};
        if (CURRENT_TOOL === 'rtk') {
          values.enabled = document.getElementById('cfg_rtk_enabled').checked;
          values.ultraCompact = document.getElementById('cfg_rtk_ultra').checked;
        } else if (CURRENT_TOOL === 'headroom') {
          values.enabled = document.getElementById('cfg_hr_enabled').checked;
          values.proxyUrl = document.getElementById('cfg_hr_url').value.trim() || 'http://localhost:8787';
        } else if (CURRENT_TOOL === 'caveman') {
          values.enabled = document.getElementById('cfg_cm_enabled').checked;
          values.mode = document.getElementById('cfg_cm_mode').value;
          values.thinkMode = document.getElementById('cfg_cm_think').value;
        }

        try {
          var r = await fetch('/api/token-saver/config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + LOKA_AUTH
            },
            body: JSON.stringify({ tool: CURRENT_TOOL, values: values })
          });
          var d = await r.json();
          if (d.ok) {
            if (window.toast) window.toast('Config ' + CURRENT_TOOL + ' tersimpan');
            closeCfg();
          } else {
            if (window.toast) window.toast('Failed: ' + (d.error || 'unknown'));
          }
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message);
        }
      }

      async function configureServer() {
        try {
          var r = await fetch('/api/token-saver/status', { headers: { 'Authorization': 'Bearer ' + LOKA_AUTH } });
          var d = await r.json();
          var s = d.server || {};
          CURRENT_TOOL = 'server';
          document.getElementById('cfgTitle').textContent = 'Server Auto Saver';
          document.getElementById('cfgSubtitle').textContent = 'Berlaku untuk semua request (/v1/chat, stream, /v1/messages)';
          document.getElementById('cfgIcon').innerHTML = '&#9889;';
          document.getElementById('cfgBody').innerHTML =
            row('Compress tool output', '<label style="display:flex;align-items:center;gap:.5rem;font-weight:400;text-transform:none">' + toggle('cfg_srv_rtk', !!s.enabled) + ' Enable RTK compressor (git diff, grep, ls, json)</label>') +
            row('Compact long history', '<label style="display:flex;align-items:center;gap:.5rem;font-weight:400;text-transform:none">' + toggle('cfg_srv_compact', !!s.compactHistory) + ' Ringkas otomatis history yang panjang</label>') +
            row('Keep last messages', '<input type="number" id="cfg_srv_keep" min="0" max="50" value="' + (s.keepRecent || 8) + '">') +
            row('Max tokens (compact trigger)', '<input type="number" id="cfg_srv_max" min="500" value="' + (s.maxTokensEst || 8000) + '">') +
            row('AI Summarize older', '<label style="display:flex;align-items:center;gap:.5rem;font-weight:400;text-transform:none">' + toggle('cfg_srv_summary', !!s.summarizeOld) + ' Ringkas bagian lama pakai AI (provider ready)</label>');
          document.getElementById('cfgOverlay').style.display = 'flex';
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message);
        }
      }

      async function saveServer() {
        if (CURRENT_TOOL !== 'server') return;
        var body = {
          enabled: document.getElementById('cfg_srv_rtk').checked,
          compactHistory: document.getElementById('cfg_srv_compact').checked,
          keepRecent: parseInt(document.getElementById('cfg_srv_keep').value, 10) || 8,
          maxTokensEst: parseInt(document.getElementById('cfg_srv_max').value, 10) || 8000,
          summarizeOld: document.getElementById('cfg_srv_summary').checked
        };
        try {
          var r = await fetch('/api/token-saver/server-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LOKA_AUTH },
            body: JSON.stringify(body)
          });
          var d = await r.json();
          if (d.ok) { if (window.toast) window.toast('Server saver tersimpan'); closeCfg(); checkTools(); }
          else if (window.toast) window.toast('Failed: ' + (d.error || 'unknown'));
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message);
        }
      }

      async function installTool(tool) {
        var ok = await window.dialog.confirm('Install ' + tool + '?', { title: 'Install ' + tool });
        if (!ok) return;
        if (window.toast) window.toast('Installing ' + tool + '...', { duration: 60000 });
        try {
          var r = await fetch('/api/token-saver/install', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LOKA_AUTH },
            body: JSON.stringify({ tool: tool })
          });
          var d = await r.json();
          if (d.ok) { if (window.toast) window.toast(tool + ' OK'); checkTools(); }
          else if (window.toast) window.toast('Failed: ' + (d.error || 'unknown'), { duration: 8000 });
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message, { duration: 8000 });
        }
      }

      setTimeout(function() { checkTools(); loadCfg(); }, 300);
      setInterval(checkTools, 30000);
    </script>
  `;

  return layout('Token Saver', body, { active: '/token-saver', subtitle: 'Prompt dedupe and cache to cut token spend' });
}
