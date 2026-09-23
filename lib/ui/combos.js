import { getConfig } from '../config.js';
import { listCombos } from '../combo.js';
import { layout } from './layout.js';

export function renderCombos() {
  const cfg = getConfig();
  const combos = listCombos();
  const primaryKey = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '';

  const allModels = cfg.providers.flatMap(p =>
    p.models.map(m => ({ id: p.id + '/' + m, provider: p.id, status: p.status }))
  );

  const cards = combos.map(name => {
    const chain = cfg.combos[name] || [];
    const items = chain.map((entry, i) => {
      return '<div class="citem">' +
        '<span class="cnum">' + (i + 1) + '</span>' +
        '<code class="cmodel">' + entry + '</code>' +
        '<button type="button" class="cbtn cdel" data-name="' + name + '" data-idx="' + i + '">x</button>' +
        '</div>';
    }).join('');

    return '<div class="ccard">' +
      '<h3 class="ctitle">' + name + '</h3>' +
      '<div class="cmeta">' + chain.length + ' model dalam chain</div>' +
      '<div class="clist">' + (items || '<div class="cempty">Belum ada model</div>') + '</div>' +
      '<div class="cactions">' +
        '<select class="cselect" data-name="' + name + '">' +
          '<option value="">+ Tambah model...</option>' +
          allModels.map(m =>
            '<option value="' + m.id + '">' + m.id + (m.status === 'ready' ? ' (ready)' : '') + '</option>'
          ).join('') +
        '</select>' +
        '<button type="button" class="cbtn primary cadd" data-name="' + name + '">Tambah</button>' +
        '<button type="button" class="cbtn danger cdelcombo" data-name="' + name + '">Hapus Combo</button>' +
      '</div>' +
    '</div>';
  }).join('');

  const body = `
    <p class="muted">Combo = rantai provider fallback otomatis. Kalau model pertama gagal, coba berikutnya.</p>

    <div class="toolbar">
      <span class="muted">${combos.length} combo</span>
      <div class="spacer"></div>
      <button type="button" class="primary" id="btnNewCombo">+ Combo Baru</button>
    </div>

    <div class="cgrid">
      ${cards || '<div class="cempty big">Belum ada combo. Klik "Combo Baru" buat bikin.</div>'}
    </div>

    <style>
      .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1rem;margin-top:1rem}
      .ccard{background:#fff;border:1px solid #e1e4e8;border-radius:12px;padding:1.1rem;display:flex;flex-direction:column;gap:.75rem}
      .ctitle{margin:0;font-size:1rem;font-weight:600;color:#1f2328}
      .cmeta{color:#656d76;font-size:.75rem}
      .clist{display:flex;flex-direction:column;gap:.35rem}
      .citem{display:flex;align-items:center;gap:.5rem;padding:.4rem .55rem;background:#f6f8fa;border-radius:6px}
      .cnum{font-size:.7rem;color:#656d76;font-weight:600;min-width:20px;text-align:center;background:#fff;border-radius:4px;padding:.1rem .3rem;border:1px solid #e1e4e8}
      .cmodel{flex:1;font-size:.75rem;background:none;padding:0;border:none;word-break:break-all}
      .cbtn{padding:.35rem .7rem;font-size:.75rem;border:1px solid #e1e4e8;background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:500;transition:all .1s}
      .cbtn:hover{border-color:#0969da;color:#0969da}
      .cbtn.primary{background:#0969da;color:#fff;border-color:#0969da}
      .cbtn.primary:hover{background:#0550ae;color:#fff}
      .cbtn.danger{background:#cf222e;color:#fff;border-color:#cf222e}
      .cbtn.danger:hover{background:#a40e26;border-color:#a40e26;color:#fff}
      .cdel{padding:.15rem .5rem;font-size:.8rem;color:#cf222e;border-color:#e1e4e8}
      .cdel:hover{background:#ffebe9;border-color:#cf222e;color:#cf222e}
      .cactions{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center}
      .cselect{flex:1;min-width:150px;padding:.4rem .55rem;border:1px solid #e1e4e8;border-radius:6px;font-family:inherit;font-size:.78rem;background:#fff}
      .cempty{text-align:center;color:#8b949e;font-size:.8rem;padding:.75rem}
      .cempty.big{padding:3rem 1rem;border:2px dashed #e1e4e8;border-radius:12px;grid-column:1/-1}
      .toolbar{display:flex;align-items:center;gap:.5rem;margin:1rem 0}
      .toolbar .spacer{flex:1}
    </style>

    <script>
      var AUTH = '${primaryKey}';

      async function api(path, body) {
        var r = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AUTH },
          body: JSON.stringify(body || {})
        });
        return r.json();
      }

      document.addEventListener('DOMContentLoaded', function () {
        var btnNew = document.getElementById('btnNewCombo');
        if (btnNew) {
          btnNew.onclick = async function () {
            var name = window.dialog.prompt('Nama combo baru:');
            if (!name || !name.trim()) return;
            var d = await api('/api/combos/create', { name: name.trim() });
            if (d.ok) { toast('Combo dibuat'); setTimeout(function(){ location.reload(); }, 500); }
            else { toast('Gagal: ' + (d.error || '?')); }
          };
        }

        document.querySelectorAll('.cadd').forEach(function (btn) {
          btn.onclick = async function () {
            var name = btn.getAttribute('data-name');
            var sel = document.querySelector('.cselect[data-name="' + name + '"]');
            if (!sel || !sel.value) { toast('Pilih model dulu'); return; }
            var d = await api('/api/combos/add', { name: name, model: sel.value });
            if (d.ok) { toast('Model ditambahkan'); setTimeout(function(){ location.reload(); }, 400); }
            else { toast('Gagal: ' + (d.error || '?')); }
          };
        });

        document.querySelectorAll('.cdel').forEach(function (btn) {
          btn.onclick = async function () {
            var name = btn.getAttribute('data-name');
            var idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (!window.dialog.confirm('Hapus model #' + (idx + 1) + ' dari combo "' + name + '"?')) return;
            var d = await api('/api/combos/remove', { name: name, idx: idx });
            if (d.ok) { toast('Model dihapus'); setTimeout(function(){ location.reload(); }, 400); }
            else { toast('Gagal: ' + (d.error || '?')); }
          };
        });

        document.querySelectorAll('.cdelcombo').forEach(function (btn) {
          btn.onclick = async function () {
            var name = btn.getAttribute('data-name');
            if (!window.dialog.confirm('Hapus combo "' + name + '" beserta semua isinya?')) return;
            var d = await api('/api/combos/delete', { name: name });
            if (d.ok) { toast('Combo dihapus'); setTimeout(function(){ location.reload(); }, 400); }
            else { toast('Gagal: ' + (d.error || '?')); }
          };
        });
      });
    </script>
  `;

  return layout('Combos', body, { active: '/combos' });
}