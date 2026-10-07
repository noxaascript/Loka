import { getConfig } from '../config.js';
import { getStats } from '../stats.js';
import { layout } from './layout.js';

export function renderKeys() {
  const cfg = getConfig();
  const stats = getStats();
  const primaryKey = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '';

  const rows = (cfg.clients || []).map(c => {
    const s = stats.clients[c.name] || { req: 0, tokens: 0 };
    return `
      <tr>
        <td><b>${c.name}</b></td>
        <td><code>${c.key}</code></td>
        <td><span class="pill info">${c.tier || 'standard'}</span></td>
        <td>${s.req}</td>
        <td>${(s.tokens || 0).toLocaleString()}</td>
        <td>
          <button class="sm ghost" onclick="copyKey('${c.key}')">Copy</button>
          <button class="sm danger" onclick="deleteKey('${c.name}')"></button>
        </td>
      </tr>
    `;
  }).join('');

  const body = `
    <p class="muted">API key untuk akses <code>/v1/*</code>. Kirim via header <code>Authorization: Bearer &lt;key&gt;</code>.</p>

    <div class="toolbar">
      <span class="muted">${(cfg.clients || []).length} key active</span>
      <div class="spacer"></div>
      <button onclick="showNewKey()">+ Key Baru</button>
    </div>

    <div class="table-wrap">
      <table>
        <tr><th>Nama</th><th>Key</th><th>Tier</th><th>Req</th><th>Tokens</th><th>Actions</th></tr>
        ${rows || '<tr><td colspan="6" class="dim">No key</td></tr>'}
      </table>
    </div>

    <script>
      var AUTH = '${primaryKey}';

      async function api(path, body) {
        var r = await fetch(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + AUTH
          },
          body: body ? JSON.stringify(body) : undefined
        });
        return r.json();
      }

      function copyKey(k) {
        navigator.clipboard.writeText(k);
        if (window.toast) window.toast('Copied');
      }

      async function showNewKey() {
        var name = await window.dialog.prompt('Client name:', '', { title: 'Key Baru', icon: '' });
        if (name === null || name === undefined) return;
        name = String(name).trim();
        if (!name) return;

        var tier = await window.dialog.prompt('Tier (standard/unlimited):', 'standard', { title: 'Pilih Tier', icon: '' });
        tier = tier == null ? 'standard' : String(tier).trim();
        if (!tier) tier = 'standard';

        var res = await api('/api/keys/create', { name: name, tier: tier });
        if (res.ok) {
          if (window.toast) window.toast('Key dibuat');
          setTimeout(function(){ location.reload(); }, 800);
        } else {
          if (window.toast) window.toast('Failed: ' + (res.error || 'unknown'));
        }
      }

      async function deleteKey(name) {
        var ok = await window.dialog.confirm('Delete key "' + name + '"?', { title: 'Delete API Key', icon: '' });
        if (!ok) return;
        var res = await api('/api/keys/delete', { name: name });
        if (res.ok) {
          if (window.toast) window.toast('Key dihapus');
          setTimeout(function(){ location.reload(); }, 400);
        } else {
          if (window.toast) window.toast('Failed: ' + (res.error || 'unknown'));
        }
      }
    </script>
  `;

  return layout('API Keys', body, { active: '/keys', subtitle: 'Client credentials allowed to call this proxy' });
}