import { layout } from './layout.js';
import { getBughuntConfig } from '../bughunt/config-store.js';

export function renderBughunt(key) {
  const base = getBughuntConfig().path;
  const body = `
    <p class="dim">Dev-only. Hidden. Rahasia.</p>

    <div class="stats-grid" id="bh-stats" style="margin-bottom:1.5rem">
      <div class="stat"><div class="label">Total</div><div class="value" id="s-total">-</div></div>
      <div class="stat"><div class="label">Open</div><div class="value" id="s-open">-</div></div>
      <div class="stat"><div class="label">Resolved</div><div class="value" id="s-resolved">-</div></div>
      <div class="stat"><div class="label">Last 24h</div><div class="value" id="s-24h">-</div></div>
    </div>

    <div class="toolbar">
      <button class="sm ghost" onclick="bhRefresh()">Refresh</button>
      <button class="sm ghost" onclick="bhDiag()">Run Diagnostics</button>
      <button class="sm ghost" onclick="bhAnalyze()">Run Analyzer</button>
      <button class="sm danger" onclick="bhClear()">Clear All</button>
    </div>

    <div id="bh-tabs" style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap">
      <button class="sm" onclick="bhTab('bugs')" id="tab-bugs">Bugs</button>
      <button class="sm ghost" onclick="bhTab('diag')" id="tab-diag">Diagnostics</button>
      <button class="sm ghost" onclick="bhTab('analyze')" id="tab-analyze">Analyzer</button>
    </div>

    <div id="bh-body"></div>

    <script>
      var BASE = ${JSON.stringify(base)};
      var KEY = ${JSON.stringify(key)};

      function api(path, method, body) {
        return fetch(BASE + '/api' + path, {
          method: method || 'GET',
          headers: { 'x-dev-key': KEY, 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined
        }).then(r => r.json());
      }

      function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
          '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[c]));
      }

      async function bhRefresh() {
        var d = await api('/stats');
        if (d.ok) {
          document.getElementById('s-total').textContent = d.stats.total;
          document.getElementById('s-open').textContent = d.stats.open;
          document.getElementById('s-resolved').textContent = d.stats.resolved;
          document.getElementById('s-24h').textContent = d.stats.last24h;
        }
        var list = await api('/bugs');
        if (list.ok) renderBugs(list.bugs);
      }

      function renderBugs(bugs) {
        if (!bugs.length) { document.getElementById('bh-body').innerHTML = '<div class="empty">No bugs yet</div>'; return; }
        var html = bugs.map(b => {
          var s = b.sample || {};
          var pill = b.status === 'open' ? 'err' : (b.status === 'resolved' ? 'ok' : 'dim');
          return '<div class="card" style="margin-bottom:.75rem">' +
            '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start">' +
              '<div style="flex:1;min-width:0">' +
                '<div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.35rem">' +
                  '<span class="pill ' + pill + '">' + esc(b.status) + '</span>' +
                  '<code style="font-size:.7rem">' + esc(b.fp) + '</code>' +
                  '<span class="dim" style="font-size:.7rem">&times; ' + b.count + '</span>' +
                '</div>' +
                '<div style="font-family:ui-monospace,monospace;font-size:.78rem;word-break:break-all">' + esc(s.message || '-') + '</div>' +
                '<div class="dim" style="font-size:.68rem;margin-top:.35rem">' +
                  esc(s.route || '-') + '  ' + esc(s.provider || '-') + '  ' + esc(s.model || '-') +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end">' +
                '<button class="sm ghost" onclick="bhView(\\'' + b.fp + '\\')">View</button>' +
                '<button class="sm ghost" onclick="bhResolve(\\'' + b.fp + '\\')">Resolve</button>' +
                '<button class="sm danger" onclick="bhDelete(\\'' + b.fp + '\\')">Delete</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');
        document.getElementById('bh-body').innerHTML = html;
      }

      async function bhView(fp) {
        var d = await api('/bugs/' + fp);
        if (!d.ok) { toast('not found'); return; }
        var b = d.bug;
        var occ = (b.occurrences || []).slice(-10).map(o =>
          '<div style="padding:.5rem;border-bottom:1px solid var(--line);font-size:.7rem;font-family:ui-monospace">' +
            '<div class="dim">' + new Date(o.at).toLocaleString() + '</div>' +
            '<div>' + esc(o.message) + '</div>' +
          '</div>'
        ).join('');
        document.getElementById('bh-body').innerHTML =
          '<button class="sm ghost" onclick="bhRefresh()" style="margin-bottom:.75rem">&larr; Back</button>' +
          '<div class="card">' +
            '<h3>' + esc(b.fp) + '</h3>' +
            '<div class="row"><span>Status</span><span>' + esc(b.status) + '</span></div>' +
            '<div class="row"><span>Count</span><span>' + b.count + '</span></div>' +
            '<div class="row"><span>First</span><span>' + new Date(b.firstSeen).toLocaleString() + '</span></div>' +
            '<div class="row"><span>Last</span><span>' + new Date(b.lastSeen).toLocaleString() + '</span></div>' +
            '<pre style="margin-top:.75rem;font-size:.7rem;max-height:200px;overflow:auto">' + esc((b.sample && b.sample.stack) || '') + '</pre>' +
            '<h3 style="margin-top:1rem">Recent (10)</h3>' +
            occ +
            '<div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">' +
              '<button class="sm ghost" onclick="bhReport(\\'' + b.fp + '\\')">Download MD</button>' +
              '<button class="sm ghost" onclick="bhDraft(\\'' + b.fp + '\\')">Draft Issue</button>' +
              '<button class="sm ghost" onclick="bhWebhook(\\'' + b.fp + '\\')">Webhook</button>' +
            '</div>' +
          '</div>';
      }

      async function bhResolve(fp) {
        await api('/bugs/' + fp, 'POST', { status: 'resolved' });
        bhRefresh();
      }

      async function bhDelete(fp) {
        if (!confirm('Delete bug ' + fp + '?')) return;
        await api('/bugs/' + fp, 'DELETE');
        bhRefresh();
      }

      async function bhClear() {
        if (!confirm('Delete SEMUA bug?')) return;
        await api('/clear', 'POST');
        bhRefresh();
      }

      async function bhReport(fp) {
        window.open(BASE + '/api/bugs/' + fp + '/report?k=' + KEY, '_blank');
      }

      async function bhDraft(fp) {
        var d = await api('/bugs/' + fp + '/draft-issue');
        if (!d.ok) { toast('failed'); return; }
        var txt = d.draft.title + '\\n\\n' + d.draft.body;
        navigator.clipboard.writeText(txt);
        toast('Draft issue copied to clipboard');
      }

      async function bhWebhook(fp) {
        var d = await api('/bugs/' + fp + '/webhook', 'POST');
        toast(d.ok ? 'Webhook sent' : ('Failed: ' + (d.error || (d.result && d.result.error) || '?')));
      }

      async function bhDiag() {
        bhTabClass('diag');
        document.getElementById('bh-body').innerHTML = '<div class="empty">Running...</div>';
        var d = await api('/diag');
        if (!d.ok) { document.getElementById('bh-body').innerHTML = '<div class="empty">Error: ' + esc(d.error) + '</div>'; return; }
        var g = d.diag;
        var prov = g.providers.map(p =>
          '<div class="row"><span>' + esc(p.id) + '</span><span>' +
            (p.ok ? '<span class="pill ok">OK ' + p.latencyMs + 'ms</span>' :
             '<span class="pill err">' + esc(p.status || p.reason || 'fail') + '</span>') +
          '</span></div>'
        ).join('');
        document.getElementById('bh-body').innerHTML =
          '<div class="card">' +
            '<h3>Runtime</h3>' +
            '<div class="row"><span>Uptime</span><span>' + g.runtime.uptimeSec + 's</span></div>' +
            '<div class="row"><span>Node</span><span>' + esc(g.runtime.node) + '</span></div>' +
            '<div class="row"><span>Platform</span><span>' + esc(g.runtime.platform) + '</span></div>' +
            '<div class="row"><span>RSS</span><span>' + g.runtime.memoryMB.rss + ' MB</span></div>' +
            '<div class="row"><span>Heap</span><span>' + g.runtime.memoryMB.heapUsed + ' / ' + g.runtime.memoryMB.heapTotal + ' MB</span></div>' +
            '<div class="row"><span>Disk data/</span><span>' + g.disk.dataDirMB + ' MB</span></div>' +
          '</div>' +
          '<div class="card" style="margin-top:1rem"><h3>Providers</h3>' + (prov || '<div class="dim">none</div>') + '</div>';
      }

      async function bhAnalyze() {
        bhTabClass('analyze');
        document.getElementById('bh-body').innerHTML = '<div class="empty">Scanning lib/*.js...</div>';
        var d = await api('/analyze');
        if (!d.ok) { document.getElementById('bh-body').innerHTML = '<div class="empty">Error</div>'; return; }
        if (!d.findings.length) { document.getElementById('bh-body').innerHTML = '<div class="empty">Bersih. None finding(s).</div>'; return; }
        var bySev = { err: 'err', warn: 'warn', info: 'info' };
        var rows = d.findings.map(f =>
          '<div class="row"><span>' +
            '<span class="pill ' + (bySev[f.severity] || 'dim') + '">' + esc(f.severity) + '</span> ' +
            '<code style="font-size:.7rem">' + esc(f.file) + ':' + f.line + '</code>' +
          '</span><span style="font-size:.72rem">' + esc(f.message) + '</span></div>'
        ).join('');
        document.getElementById('bh-body').innerHTML =
          '<div class="card"><h3>' + d.findings.length + ' finding(s)</h3>' + rows + '</div>';
      }

      function bhTabClass(name) {
        ['bugs', 'diag', 'analyze'].forEach(t => {
          var b = document.getElementById('tab-' + t);
          if (!b) return;
          if (t === name) b.className = 'sm';
          else b.className = 'sm ghost';
        });
      }

      function bhTab(name) {
        bhTabClass(name);
        if (name === 'bugs') return bhRefresh();
        if (name === 'diag') return bhDiag();
        if (name === 'analyze') return bhAnalyze();
      }

      setTimeout(bhRefresh, 300);
      setInterval(function() {
        var t = document.getElementById('tab-bugs');
        if (t && t.className === 'sm') bhRefresh();
      }, 15000);
    </script>
  `;
  return layout('Bug Hunter', body, { active: '__bughunt', subtitle: 'Diagnostics and issue triage' });
}
