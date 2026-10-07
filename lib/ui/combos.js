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
        '<button type="button" class="cbtn cdel" data-name="' + name + '" data-idx="' + i + '" title="Delete">&times;</button>' +
        '</div>';
    }).join('');

    return '<div class="ccard">' +
      '<h3 class="ctitle">' + name + '</h3>' +
      '<div class="cmeta">' + chain.length + ' models in chain</div>' +
      '<div class="clist">' + (items || '<div class="cempty">No models yet</div>') + '</div>' +
      '<div class="cactions">' +
        '<button type="button" class="cbtn primary cadd" data-name="' + name + '">+ Add Model</button>' +
        '<button type="button" class="cbtn danger cdelcombo" data-name="' + name + '">Delete Combo</button>' +
      '</div>' +
    '</div>';
  }).join('');

  const body = `
    <p class="muted">Combo = automatic provider fallback chain. If the first model fails, try the next.</p>

    <div class="toolbar">
      <span class="muted">${combos.length} combo</span>
      <div class="spacer"></div>
      <button type="button" id="btnNewCombo">+ New Combo</button>
    </div>

    <div class="cgrid">
      ${cards || '<div class="cempty big">No combos yet. Click "New Combo" to create one.</div>'}
    </div>

    <div class="loka-dialog-overlay" id="pickerOverlay" style="display:none">
      <div class="loka-dialog" style="max-width:560px;max-height:85vh;display:flex;flex-direction:column">
        <h3 id="pickerTitle">Add Model</h3>
        <p class="dim" id="pickerSubtitle"></p>

        <input type="text" id="pickerSearch" placeholder="Search model atau provider..." autocomplete="off">

        <div id="pickerList"></div>

        <div class="picker-foot">
          <span class="dim" id="pickerCount">Nothing selected</span>
          <button class="ghost" onclick="closePicker()">Cancel</button>
          <button id="pickerAdd" disabled>Add</button>
        </div>
      </div>
    </div>


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
            '<div class="no-result">No providers connected.<br><br>' +
            'Connect a provider first at <a href="/providers">the Providers page</a> so its models appear here.</div>';
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
          document.getElementById('pickerList').innerHTML = '<div class="no-result">No models match "' + q + '"</div>';
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
              (exists ? '<span class="badge-exists">already exists</span>' : '') +
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
        document.getElementById('pickerCount').textContent = n ? n + ' model(s) selected' : 'Nothing selected';
        document.getElementById('pickerAdd').disabled = n === 0;
      }

      function openPicker(name) {
        CURRENT_COMBO = { name: name, chain: window.__comboChains[name] || [] };
        SELECTED = new Set();
        COLLAPSED = new Set();

        document.getElementById('pickerTitle').textContent = 'Add Model ke "' + name + '"';
        document.getElementById('pickerSubtitle').textContent = 'Models grouped by connected provider.';
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
            var name = await window.dialog.prompt('New combo name:');
            if (!name || !name.trim()) return;
            var d = await api('/api/combos/create', { name: name.trim() });
            if (d.ok) { toast('Combo created'); setTimeout(function(){ location.reload(); }, 500); }
            else { toast('Failed: ' + (d.error || '?')); }
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
            toast(ok + ' model added' + (fail ? ' (' + fail + ' failed)' : ''));
            setTimeout(function(){ location.reload(); }, 600);
          } else {
            toast('Failed: ' + (lastErr || '?'));
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
            if (!window.dialog.confirm('Remove model #' + (idx + 1) + ' of combo "' + name + '"?')) return;
            var d = await api('/api/combos/remove', { name: name, idx: idx });
            if (d.ok) { toast('Model removed'); setTimeout(function(){ location.reload(); }, 400); }
            else { toast('Failed: ' + (d.error || '?')); }
          };
        });

        document.querySelectorAll('.cdelcombo').forEach(function (btn) {
          btn.onclick = async function () {
            var name = btn.getAttribute('data-name');
            if (!window.dialog.confirm('Delete combo "' + name + '" and everything in it?')) return;
            var d = await api('/api/combos/delete', { name: name });
            if (d.ok) { toast('Combo deleted'); setTimeout(function(){ location.reload(); }, 400); }
            else { toast('Failed: ' + (d.error || '?')); }
          };
        });
      });
    </script>
  `;

  return layout('Combos', body, { active: '/combos', subtitle: 'Route one model name to several upstreams' });
}
