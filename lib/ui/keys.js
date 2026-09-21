import { getConfig } from '../config.js';
import { getStats } from '../stats.js';
import { layout } from './layout.js';

export function renderKeys() {
  const cfg = getConfig();
  const stats = getStats();

  const rows = (cfg.clients || []).map((c, i) => {
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
          <button class="sm danger" onclick="deleteKey('${c.name}')">×</button>
        </td>
      </tr>
    `;
  }).join('');

  const body = `
    <p class="muted">API key untuk akses <code>/v1/*</code>. Kirim via header <code>Authorization: Bearer &lt;key&gt;</code>.</p>

    <div class="toolbar">
      <span class="muted">${(cfg.clients || []).length} key aktif</span>
      <div class="spacer"></div>
      <button onclick="showNewKey()">+ Key Baru</button>
    </div>

    <table>
      <tr><th>Nama</th><th>Key</th><th>Tier</th><th>Req</th><th>Tokens</th><th>Aksi</th></tr>
      ${rows || '<tr><td colspan="6" class="dim">Belum ada key</td></tr>'}
    </table>

    <script>
      async function api(method, path, body) {
        const r = await fetch(path, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer loka-local'
          },
          body: body ? JSON.stringify(body) : undefined
        });
        return r.json();
      }

      function copyKey(k) {
        navigator.clipboard.writeText(k);
        toast('Copied: ' + k.slice(0, 12) + '...');
      }

      async function showNewKey() {
        const name = prompt('Nama client:');
        if (!name) return;
        const key = prompt('API key:', 'loka-' + Math.random().toString(36).slice(2, 10));
        if (!key) return;
        const tier = prompt('Tier (standard/unlimited):', 'standard') || 'standard';
        await api('POST', '/api/keys/create', { name, key, tier });
        toast('Key dibuat');
        setTimeout(() => location.reload(), 400);
      }

      async function deleteKey(name) {
        if (!confirm('Hapus key ' + name + '?')) return;
        await api('POST', '/api/keys/delete', { name });
        setTimeout(() => location.reload(), 300);
      }
    </script>
  `;

  return layout('API Keys', body, { active: '/keys' });
}
