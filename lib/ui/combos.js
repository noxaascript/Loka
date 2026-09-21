import { getConfig } from '../config.js';
import { listCombos } from '../combo.js';
import { layout } from './layout.js';

export function renderCombos() {
  const cfg = getConfig();
  const combos = listCombos();

  const allModels = cfg.providers.flatMap(p =>
    p.models.map(m => ({ id: `${p.id}/${m}`, provider: p.id }))
  );

  const cards = combos.map(name => {
    const chain = cfg.combos[name] || [];
    const items = chain.map((entry, i) => {
      const [pid] = entry.split('/');
      return `
        <div style="display:flex;align-items:center;gap:.5rem;padding:.5rem;background:var(--bg3);border-radius:6px;margin-bottom:.35rem">
          <span class="pill dim">${i + 1}</span>
          <code style="flex:1">${entry}</code>
          <button class="sm ghost" onclick="removeFromCombo('${name}', ${i})">×</button>
        </div>
      `;
    }).join('');

    return `
      <div class="card">
        <h3>⛓ ${name}</h3>
        <div class="dim" style="font-size:.75rem;margin-bottom:.5rem">${chain.length} model dalam chain</div>
        ${items}
        <div class="toolbar" style="margin-top:.75rem">
          <select id="add-${name}" style="flex:1">
            <option value="">+ Tambah model...</option>
            ${allModels.map(m => `<option value="${m.id}">${m.id}</option>`).join('')}
          </select>
          <button class="sm" onclick="addToCombo('${name}')">Tambah</button>
          <button class="sm danger" onclick="deleteCombo('${name}')">Hapus Combo</button>
        </div>
      </div>
    `;
  }).join('');

  const body = `
    <div class="toolbar">
      <span class="muted">${combos.length} combo</span>
      <div class="spacer"></div>
      <button onclick="showNewCombo()">+ Combo Baru</button>
    </div>
    <div class="grid">${cards || '<div class="empty">Belum ada combo. Bikin yang pertama!</div>'}</div>

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

      async function addToCombo(name) {
        const sel = document.getElementById('add-' + name);
        const model = sel.value;
        if (!model) return;
        const d = await api('POST', '/api/combos/add', { name, model });
        toast(d.ok ? 'Ditambahkan' : 'Gagal');
        setTimeout(() => location.reload(), 500);
      }

      async function removeFromCombo(name, idx) {
        await api('POST', '/api/combos/remove', { name, idx });
        setTimeout(() => location.reload(), 300);
      }

      async function deleteCombo(name) {
        if (!confirm('Hapus combo ' + name + '?')) return;
        await api('POST', '/api/combos/delete', { name });
        setTimeout(() => location.reload(), 300);
      }

      async function showNewCombo() {
        const name = prompt('Nama combo baru:');
        if (!name) return;
        await api('POST', '/api/combos/create', { name });
        setTimeout(() => location.reload(), 300);
      }
    </script>
  `;

  return layout('Combos', body, { active: '/combos' });
}
