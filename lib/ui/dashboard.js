import { getConfig } from '../config.js';
import { layout } from './layout.js';

export function renderDashboard() {
  const cfg = getConfig();
  const primaryKey = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '';
  const port = cfg.port || 1455;

  const localUrl = 'http://localhost:' + port;

  const body = `
    <div id="updateCard" style="display:none;margin-bottom:1.5rem"></div>

    <div class="url-box">
      <span class="label">Local</span>
      <code>${localUrl}</code>
      <button type="button" class="sm ghost" onclick="copyText('${localUrl}')">Copy</button>
    </div>

    <div class="url-box" style="opacity:.5">
      <span class="label">Tailscale</span>
      <code class="dim">belum aktif  <a href="/tunnel">setup</a></code>
    </div>

    <div class="url-box">
      <span class="label">Tunnel</span>
      <code class="dim">belum jalan  <a href="/tunnel">setup</a></code>
    </div>

    <h2>API Key</h2>
    <div class="url-box">
      <span class="label">Key</span>
      <code>${primaryKey}</code>
      <button type="button" class="sm ghost" onclick="copyText('${primaryKey}')">Copy</button>
    </div>

    <div class="toolbar">
      <button type="button" class="ghost sm" onclick="regenerateKey()">Regenerate</button>
      <button type="button" class="sm" onclick="showAddKey()">+ Add API Key</button>
    </div>

    <script>
      var LOKA_AUTH = '${primaryKey}';

      function copyText(t) {
        navigator.clipboard.writeText(t);
        if (window.toast) window.toast('Copied');
      }

      async function regenerateKey() {
        if (!(await window.dialog.confirm('Regenerate API key? Key lama nggak akan berfungsi lagi.', { title: 'Regenerate Key' }))) return;

        try {
          var r = await fetch('/api/keys/regenerate', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + LOKA_AUTH }
          });
          var d = await r.json();
          if (d.ok) {
            if (window.toast) window.toast('Key baru dibuat');
            setTimeout(function () { location.reload(); }, 800);
          } else {
            if (window.toast) window.toast('Gagal: ' + (d.error || 'unknown'));
          }
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message);
        }
      }

      async function showAddKey() {
        var name = await window.dialog.prompt('Nama client:', '', { title: 'Add API Key' });
        if (name === null || name === undefined) return;
        name = String(name).trim();
        if (!name) return;

        var tier = await window.dialog.prompt('Tier (standard/unlimited):', 'standard', { title: 'Tier' });
        tier = tier == null ? 'standard' : String(tier).trim();
        if (!tier) tier = 'standard';

        try {
          var r = await fetch('/api/keys/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + LOKA_AUTH
            },
            body: JSON.stringify({ name: name, tier: tier })
          });
          var d = await r.json();
          if (d.ok) {
            if (window.toast) window.toast('Key dibuat: ' + (d.key || '').slice(0, 20) + '...');
            setTimeout(function () { location.reload(); }, 900);
          } else {
            if (window.toast) window.toast('Gagal: ' + (d.error || 'unknown'));
          }
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message);
        }
      }

      async function doUpdateNow() {
        var ok = await window.dialog.confirm(
          'Update Loka ke versi terbaru? Setelah update, restart manual: Ctrl+C di terminal, lalu node index.js.',
          { title: 'Update Loka' }
        );
        if (!ok) return;

        if (window.toast) window.toast('Updating Loka... (bisa 1-2 menit)', { duration: 120000 });

        try {
          var r = await fetch('/api/update/proxy', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + LOKA_AUTH }
          });
          var d = await r.json();
          if (d.ok) {
            if (window.toast) window.toast('Update sukses. Restart manual: Ctrl+C lalu node index.js', { duration: 20000 });
          } else {
            if (window.toast) window.toast('Gagal: ' + (d.error || 'unknown'), { duration: 8000 });
          }
        } catch (e) {
          if (window.toast) window.toast('Error: ' + e.message, { duration: 8000 });
        }
      }

      async function pollUpdateCard() {
        try {
          var r = await fetch('/api/update/state', {
            headers: { 'Authorization': 'Bearer ' + LOKA_AUTH }
          });
          var d = await r.json();
          if (!d || !d.updateAvailable) return;

          var card = document.getElementById('updateCard');
          if (!card) return;
          card.style.display = 'block';
          card.innerHTML =
            '<div class="card" style="border-left:3px solid #f59e0b">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">' +
                '<div>' +
                  '<h3 style="margin:0 0 .25rem">Update Tersedia</h3>' +
                  '<p class="muted" style="margin:0;font-size:.82rem">' +
                    'Sekarang <code>' + (d.installed || '?') + '</code>  ' +
                    'Terbaru <code style="color:var(--accent)">' + d.latest + '</code>' +
                  '</p>' +
                '</div>' +
                '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
                  '<button type="button" id="btnUpdateNow" onclick="doUpdateNow()">Update Sekarang</button>' +
                  '<button type="button" class="ghost" onclick="location.href=\\'/cli\\'">Buka CLI Tools</button>' +
                '</div>' +
              '</div>' +
              '<pre style="margin:.75rem 0 0">npm install -g loka-ai-router@' + (d.latest || 'beta') + '</pre>' +
            '</div>';
        } catch (e) {
          // silent
        }
      }

      setTimeout(pollUpdateCard, 3000);
    </script>
  `;

  return layout('Home', body, { active: '/' });
}