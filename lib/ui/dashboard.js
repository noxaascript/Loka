import { getConfig } from '../config.js';
import { layout } from './layout.js';
import { execSync } from 'child_process';

function checkTailscale() {
  try {
    const status = execSync('tailscale status --json 2>/dev/null', { encoding: 'utf-8' });
    const data = JSON.parse(status);
    if (data.BackendState !== 'Running') return null;
    return data.Self?.TailscaleIPs?.[0] || null;
  } catch {
    return null;
  }
}

export function renderDashboard() {
  const cfg = getConfig();
  const tsIP = checkTailscale();
  const localUrl = `http://localhost:${cfg.port}`;
  const primaryKey = cfg.clients?.[0]?.key || 'sk-not-generated';

  const copyBtn = (url) => `<button class="sm ghost" onclick="copyUrl('${url}')">Copy</button>`;

  const body = `
    <div id="updateCard" style="display:none;margin-bottom:1.5rem"></div>
    <div class="url-box">
      <span class="label">Local</span>
      <code>${localUrl}</code>
      ${copyBtn(localUrl)}
    </div>

    ${tsIP ? `
      <div class="url-box">
        <span class="label">Tailscale</span>
        <code>http://${tsIP}:${cfg.port}</code>
        ${copyBtn(`http://${tsIP}:${cfg.port}`)}
      </div>
    ` : `
      <div class="url-box" style="opacity:.5">
        <span class="label">Tailscale</span>
        <code class="dim">not active — <a href="/tunnel">setup</a></code>
      </div>
    `}

    <div class="url-box">
      <span class="label">Tunnel</span>
      <code class="dim">not running — <a href="/tunnel">setup</a></code>
    </div>

    <h2>Access Key</h2>
    <div class="url-box">
      <span class="label">Key</span>
      <code id="mainKey">${primaryKey}</code>
      ${copyBtn(primaryKey)}
    </div>

    <div class="toolbar">
      <button class="ghost sm" onclick="regenerateKey()">🔄 Regenerate</button>
      <button class="sm" onclick="showAddKey()">+ Add API Key</button>
    </div>

    <script>
      function copyUrl(url) {
        navigator.clipboard.writeText(url).then(() => toast('Copied'));
      }

      function getCurrentKey() {
        return document.getElementById('mainKey').textContent;
      }

      async function regenerateKey() {
        if (!window.dialog.confirm('Regenerate API key? The old key will stop working.')) return;
        try {
          const r = await fetch('/api/keys/regenerate', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getCurrentKey() }
          });
          const d = await r.json();
          if (d.ok) {
            document.getElementById('mainKey').textContent = d.key;
            toast('New key generated');
            setTimeout(() => location.reload(), 800);
          } else {
            toast('Failed: ' + (d.error || 'unknown'));
          }
        } catch (e) {
          toast('Error: ' + e.message);
        }
      }

      function showAddKey() {
        const name = window.dialog.prompt('Client name:');
        if (!name) return;
        const tier = window.dialog.prompt('Tier (standard/unlimited):', 'standard') || 'standard';

        fetch('/api/keys/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getCurrentKey()
          },
          body: JSON.stringify({ name, tier })
        })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            toast('Created: ' + d.key.slice(0, 20) + '...');
            setTimeout(() => location.href = '/keys', 800);
          } else {
            toast('Failed: ' + (d.error || 'unknown'));
          }
        })
        .catch(e => toast('Error: ' + e.message));
      }
    </script>
  
    <script>
      var LOKA_AUTH = window.LOKA_KEY || '';
      function pollUpdateCard() {
        fetch('/api/update/state', { headers: { 'Authorization': 'Bearer ' + (window.LOKA_KEY || '') } })
          .then(function(r) { return r.ok ? r.json() : null; })
          .then(function(d) {
            if (!d || !d.updateAvailable) return;
            var card = document.getElementById('updateCard');
            if (!card) return;
            card.style.display = 'block';
            card.innerHTML =
              '<div class="card" style="border-left:3px solid #f59e0b">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">' +
                  '<div>' +
                    '<h3 style="margin:0 0 .25rem">\u2b06 Update Tersedia</h3>' +
                    '<p class="muted" style="margin:0;font-size:.82rem">' +
                      'Versi sekarang <code>' + (d.installed || '?') + '</code> \u00b7 ' +
                      'Terbaru <code style="color:var(--accent)">' + d.latest + '</code>' +
                    '</p>' +
                  '</div>' +
                  '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
                    '<button id="btnUpdateNow" onclick="doUpdateNow()">Update Sekarang</button>' +
                    '<button class="ghost" onclick="location.href=\'/cli\'">Buka CLI Tools</button>' +
                  '</div>' +
                '</div>' +
                '<pre style="margin:.75rem 0 0">npm install -g loka-ai-router@' + (d.latest || 'beta') + '</pre>' +
              '</div>';
          })
          .catch(function(){});
      }

      async function doUpdateNow() {
        var btn = document.getElementById('btnUpdateNow');
        var ok = await window.dialog.confirm(
          'Update Loka ke versi terbaru? Setelah update, kamu harus restart manual:\n\n1. Tutup server (Ctrl+C di terminal)\n2. Jalanin ulang: node index.js',
          { title: 'Update Loka', icon: '\u2b06' }
        );
        if (!ok) return;
        if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }
        if (window.toast) window.toast('Updating Loka...', { duration: 90000 });
        try {
          var r = await fetch('/api/update/proxy', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + (window.LOKA_KEY || '') }
          });
          var d = await r.json();
          if (d.ok) {
            if (window.toast) window.toast('Update sukses. Restart manual: Ctrl+C lalu node index.js', { duration: 20000 });
            if (btn) { btn.textContent = 'Restart Manual Diperlukan'; }
          } else {
            if (window.toast) window.toast('Gagal: ' + (d.error || 'unknown'), { duration: 8000 });
            if (btn) { btn.disabled = false; btn.textContent = 'Update Sekarang'; }
          }
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message, { duration: 8000 });
          if (btn) { btn.disabled = false; btn.textContent = 'Update Sekarang'; }
        }
      }
      function copyUpdateCmd() {
        navigator.clipboard.writeText('npm install -g loka-ai-router@beta');
        if (window.toast) window.toast('Command copied');
      }
      setTimeout(pollUpdateCard, 3000);
    <\/script>
  `;

  return layout('Home', body, { active: '/' });
}
