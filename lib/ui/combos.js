import { getConfig } from '../config.js';
import { listCombos } from '../combo.js';
import { layout } from './layout.js';

export function renderCombos() {
  const cfg = getConfig();
  const combos = listCombos();
  const primaryKey = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '';

  const cards = combos.map(name => {
    const chain = cfg.combos[name] || [];

    const items = chain.map((entry, i) => {
      const slash = entry.indexOf('/');
      const pid = slash > 0 ? entry.slice(0, slash) : '';
      const mid = slash > 0 ? entry.slice(slash + 1) : entry;
      const prov = pid ? cfg.providers.find(p => p.id === pid) : null;
      const status = prov ? prov.status : 'unknown';
      const statusClass = status === 'ready' ? 'ok' : (status === 'error' ? 'err' : 'dim');

      return '<div class="citem">' +
        '<span class="cnum">' + (i + 1) + '</span>' +
        '<span class="pill ' + statusClass + ' cpill">' + (pid || '?') + '</span>' +
        '<code class="cmodel">' + mid + '</code>' +
        '<button type="button" class="cbtn cdel" data-name="' + name + '" data-idx="' + i + '" title="Hapus">&times;</button>' +
        '</div>';
    }).join('');

    return '<div class="ccard">' +
      '<h3 class="ctitle">' + name + '</h3>' +
      '<div class="cmeta">' + chain.length + ' model dalam chain</div>' +
      '<div class="clist">' + (items || '<div class="cempty">Belum ada model</div>') + '</div>' +
      '<div class="cactions">' +
        '<button type="button" class="cbtn primary cadd" data-name="' + name + '">+ Tambah Model</button>' +
        '<button type="button" class="cbtn danger cdelcombo" data-name="' + name + '">Hapus Combo</button>' +
      '</div>' +
    '</div>';
  }).join('');

  const body = `
    <p class="muted">Combo = rantai provider fallback otomatis. Kalau model pertama gagal, coba berikutnya.</p>

    <div class="toolbar">
      <span class="muted">${combos.length} combo</span>
      <div class="spacer"></div>
      <button type="button" id="btnNewCombo">+ Combo Baru</button>
    </div>

    <div class="cgrid">
      ${cards || '<div class="cempty big">Belum ada combo. Klik "Combo Baru" buat bikin.</div>'}
    </div>

    <div class="loka-dialog-overlay" id="pickerOverlay" style="display:none">
      <div class="loka-dialog" style="max-width:560px;max-height:85vh;display:flex;flex-direction:column">
        <h3 id="pickerTitle">Tambah Model</h3>
        <p class="dim" id="pickerSubtitle"></p>

        <input type="text" id="pickerSearch" placeholder="Cari model atau provider..." autocomplete="off">

        <div id="pickerList"></div>

        <div class="picker-foot">
          <span class="dim" id="pickerCount">Belum ada yang dipilih</span>
          <button class="ghost" onclick="closePicker()">Cancel</button>
          <button id="pickerAdd" disabled>Tambah</button>
        </div>
      </div>
    </div>

    <style>
      .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1rem;margin-top:1rem}
      .ccard{
        background:var(--glass-bg);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
        border:1px solid var(--glass-border);border-radius:var(--r);padding:1.15rem;
        display:flex;flex-direction:column;gap:.7rem;
        box-shadow:var(--glass-shadow),inset 0 1px 0 rgba(255,255,255,.4);
        transition:all .22s cubic-bezier(.4,0,.2,1);
      }
      .ccard:hover{transform:translateY(-2px);border-color:var(--border-2)}
      .ctitle{margin:0;font-size:.95rem;font-weight:500;color:var(--text-1);letter-spacing:-.01em}
      .cmeta{color:var(--text-3);font-size:.72rem;font-weight:400;letter-spacing:.01em}
      .clist{display:flex;flex-direction:column;gap:.3rem}
      .citem{
        display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem;
        background:var(--bg-2);border-radius:9px;border:1px solid var(--border-1);
        transition:border-color .15s;
      }
      .citem:hover{border-color:var(--border-2)}
      .cnum{
        font-size:.68rem;color:var(--text-3);font-weight:500;
        min-width:18px;text-align:center;padding:.05rem .3rem;
        background:var(--glass-bg);border-radius:4px;border:1px solid var(--border-1);
      }
      .cpill{font-size:.6rem !important;padding:.15rem .5rem !important;font-weight:500 !important}
      .cmodel{
        flex:1;font-size:.76rem;background:none;padding:0;border:none;
        word-break:break-all;font-family:ui-monospace,Menlo,monospace;
        color:var(--text-1);font-weight:400;letter-spacing:-.005em;
      }
      .cbtn{
        padding:.4rem .75rem;font-size:.75rem;border:1px solid var(--border-1);
        background:var(--glass-bg);border-radius:8px;cursor:pointer;
        font-family:inherit;font-weight:500;color:var(--text-2);
        letter-spacing:-.003em;transition:all .15s;
      }
      .cbtn:hover{border-color:var(--accent);color:var(--accent)}
      .cbtn.primary{
        background:linear-gradient(135deg,var(--accent),var(--accent-2));
        color:#fff;border-color:transparent;font-weight:500;
      }
      .cbtn.primary:hover{color:#fff;transform:translateY(-1px);box-shadow:0 6px 18px rgba(139,92,246,.3)}
      .cbtn.danger{background:transparent;color:var(--err);border-color:var(--border-1);font-weight:500}
      .cbtn.danger:hover{background:var(--err-bg);border-color:var(--err);color:var(--err)}
      .cdel{padding:.05rem .5rem;font-size:.95rem;color:var(--text-3);border-color:var(--border-1);line-height:1.3}
      .cdel:hover{background:var(--err-bg);border-color:var(--err);color:var(--err)}
      .cactions{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin-top:.2rem}
      .cempty{text-align:center;color:var(--text-3);font-size:.78rem;padding:.7rem;font-weight:400}
      .cempty.big{padding:3rem 1rem;border:2px dashed var(--border-1);border-radius:12px;grid-column:1/-1}
      .toolbar{display:flex;align-items:center;gap:.5rem;margin:1rem 0}
      .toolbar .spacer{flex:1}

      #pickerSearch{
        margin-bottom:.75rem;font-weight:400;letter-spacing:-.003em;
        font-size:.85rem;
      }
      #pickerList{
        flex:1;overflow-y:auto;margin-bottom:.85rem;padding-right:.25rem;
        max-height:52vh;
      }
      .picker-foot{
        display:flex;align-items:center;gap:.5rem;
        border-top:1px solid var(--border-1);padding-top:.85rem;
      }
      .picker-foot #pickerCount{flex:1;font-size:.75rem;font-weight:400}

      .prov-group{
        margin-bottom:.7rem;border:1px solid var(--border-1);border-radius:10px;
        overflow:hidden;background:var(--glass-bg);
      }
      .prov-head{
        display:flex;align-items:center;gap:.55rem;padding:.55rem .8rem;
        background:var(--bg-2);border-bottom:1px solid var(--border-1);
        cursor:pointer;user-select:none;transition:background .15s;
      }
      .prov-head:hover{background:var(--glass-bg-hi)}
      .prov-head .arrow{
        font-size:.6rem;color:var(--text-3);transition:transform .2s;
        width:10px;display:inline-block;font-weight:400;
      }
      .prov-group.collapsed .arrow{transform:rotate(-90deg)}
      .prov-group.collapsed .prov-body{display:none}
      .prov-name{
        font-weight:500;font-size:.8rem;color:var(--text-1);
        letter-spacing:-.005em;
      }
      .prov-count{
        color:var(--text-3);font-size:.7rem;margin-left:auto;font-weight:400;
      }
      .prov-body{padding:.3rem}
      .model-row{
        display:flex;align-items:center;gap:.55rem;padding:.45rem .65rem;
        border-radius:8px;cursor:pointer;transition:background .15s;
        font-size:.78rem;font-weight:400;
      }
      .model-row:hover{background:var(--accent-lo)}
      .model-row.selected{background:var(--accent-lo)}
      .model-row.disabled{opacity:.4;cursor:not-allowed}
      .model-row input[type="checkbox"]{width:auto;margin:0;accent-color:var(--accent)}
      .model-row code{
        background:transparent;border:none;padding:0;font-size:.76rem;
        color:var(--text-1);font-family:ui-monospace,Menlo,monospace;
        font-weight:400;letter-spacing:-.005em;
      }
      .badge-exists{
        font-size:.6rem;padding:.1rem .45rem;border-radius:6px;
        background:var(--warn-bg);color:var(--warn);margin-left:auto;font-weight:500;
      }
      .no-result{text-align:center;color:var(--text-3);padding:2rem 1rem;font-size:.8rem;font-weight:400}
      .no-result a{font-weight:500}
    </style>

    <script>
      var AUTH = '${primaryKey}';
      var AVAILABLE = [];
      var CURRENT_COMBO = null;
      var SELECTED = new Set();
      var COLLAPSED = new Set();

      async function api(path, body) {
        var r = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AUTH },
          body: JSON.stringify(body || {})
        });
        return r.json();
      }

      async function loadAvailable() {
        try {
          var r = await fetch('/api/combos/available-models', {
            headers: { 'Authorization': 'Bearer ' + AUTH }
          });
          var d = await r.json();
          if (d.ok) AVAILABLE = d.models || [];
        } catch {}
      }

      function renderPickerList() {
        var q = (document.getElementById('pickerSearch').value || '').toLowerCase().trim();
        var chain = (CURRENT_COMBO && CURRENT_COMBO.chain) || [];
        var chainSet = new Set(chain);

        if (!AVAILABLE.length) {
          document.getElementById('pickerList').innerHTML =
            '<div class="no-result">Belum ada provider yang connect.<br><br>' +
            'Connect provider dulu di <a href="/providers">halaman Providers</a> supaya model-nya muncul di sini.</div>';
          return;
        }

        var filtered = AVAILABLE.filter(function (m) {
          if (!q) return true;
          return m.model.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q);
        });

        var groups = {};
        filtered.forEach(function (m) {
          if (!groups[m.provider]) groups[m.provider] = [];
          groups[m.provider].push(m);
        });

        var providers = Object.keys(groups).sort();

        if (!providers.length) {
          document.getElementById('pickerList').innerHTML = '<div class="no-result">Tidak ada model cocok dengan "' + q + '"</div>';
          return;
        }

        var html = providers.map(function (pid) {
          var models = groups[pid];
          var collapsed = COLLAPSED.has(pid);
          var rows = models.map(function (m) {
            var exists = chainSet.has(m.ref);
            var selected = SELECTED.has(m.ref);
            return '<label class="model-row' + (exists ? ' disabled' : (selected ? ' selected' : '')) + '">' +
              '<input type="checkbox" data-ref="' + m.ref + '"' + (selected ? ' checked' : '') + (exists ? ' disabled' : '') + '>' +
              '<code>' + m.model + '</code>' +
              (exists ? '<span class="badge-exists">sudah ada</span>' : '') +
              '</label>';
          }).join('');

          return '<div class="prov-group' + (collapsed ? ' collapsed' : '') + '" data-prov="' + pid + '">' +
            '<div class="prov-head" onclick="toggleGroup(\\'' + pid + '\\')">' +
              '<span class="arrow">&#9660;</span>' +
              '<span class="prov-name">' + pid + '</span>' +
              '<span class="prov-count">' + models.length + ' model</span>' +
            '</div>' +
            '<div class="prov-body">' + rows + '</div>' +
          '</div>';
        }).join('');

        document.getElementById('pickerList').innerHTML = html;

        document.querySelectorAll('#pickerList input[type="checkbox"]').forEach(function (cb) {
          cb.onchange = function () {
            var ref = cb.getAttribute('data-ref');
            if (cb.checked) SELECTED.add(ref);
            else SELECTED.delete(ref);
            updateCount();
            cb.closest('.model-row').classList.toggle('selected', cb.checked);
          };
        });
      }

      function toggleGroup(pid) {
        if (COLLAPSED.has(pid)) COLLAPSED.delete(pid);
        else COLLAPSED.add(pid);
        renderPickerList();
      }

      function updateCount() {
        var n = SELECTED.size;
        document.getElementById('pickerCount').textContent = n ? n + ' model dipilih' : 'Belum ada yang dipilih';
        document.getElementById('pickerAdd').disabled = n === 0;
      }

      function openPicker(name) {
        CURRENT_COMBO = { name: name, chain: window.__comboChains[name] || [] };
        SELECTED = new Set();
        COLLAPSED = new Set();

        document.getElementById('pickerTitle').textContent = 'Tambah Model ke "' + name + '"';
        document.getElementById('pickerSubtitle').textContent = 'Model dikelompokkan per provider yang sudah connect.';
        document.getElementById('pickerSearch').value = '';

        document.getElementById('pickerOverlay').style.display = 'flex';
        renderPickerList();
        updateCount();
        setTimeout(function () { document.getElementById('pickerSearch').focus(); }, 100);
      }

      function closePicker() {
        document.getElementById('pickerOverlay').style.display = 'none';
        CURRENT_COMBO = null;
        SELECTED = new Set();
      }

      document.addEventListener('DOMContentLoaded', async function () {
        window.__comboChains = ${JSON.stringify(cfg.combos || {})};

        await loadAvailable();

        var btnNew = document.getElementById('btnNewCombo');
        if (btnNew) {
          btnNew.onclick = async function () {
            var name = await window.dialog.prompt('Nama combo baru:');
            if (!name || !name.trim()) return;
            var d = await api('/api/combos/create', { name: name.trim() });
            if (d.ok) { toast('Combo dibuat'); setTimeout(function(){ location.reload(); }, 500); }
            else { toast('Gagal: ' + (d.error || '?')); }
          };
        }

        document.querySelectorAll('.cadd').forEach(function (btn) {
          btn.onclick = function () { openPicker(btn.getAttribute('data-name')); };
        });

        document.getElementById('pickerSearch').oninput = renderPickerList;

        document.getElementById('pickerAdd').onclick = async function () {
          if (!CURRENT_COMBO || !SELECTED.size) return;
          var name = CURRENT_COMBO.name;
          var refs = Array.from(SELECTED);
          var ok = 0, fail = 0, lastErr = '';

          for (var i = 0; i < refs.length; i++) {
            var d = await api('/api/combos/add', { name: name, model: refs[i] });
            if (d.ok) ok++;
            else { fail++; lastErr = d.error || ''; }
          }

          if (ok > 0) {
            toast(ok + ' model ditambahkan' + (fail ? ' (' + fail + ' gagal)' : ''));
            setTimeout(function(){ location.reload(); }, 600);
          } else {
            toast('Gagal: ' + (lastErr || '?'));
          }
          closePicker();
        };

        document.getElementById('pickerOverlay').onclick = function (e) {
          if (e.target === this) closePicker();
        };

        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && document.getElementById('pickerOverlay').style.display === 'flex') {
            closePicker();
          }
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
