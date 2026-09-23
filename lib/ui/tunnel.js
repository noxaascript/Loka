import { getConfig } from '../config.js';
import { layout } from './layout.js';
import { networkInterfaces } from 'os';
import * as tunnel from '../tunnel.js';

function getLANIPs() {
  const nets = networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ iface: name, ip: net.address });
      }
    }
  }
  return ips;
}

export function renderTunnel() {
  const cfg = getConfig();
  const ips = getLANIPs();
  const ts = tunnel.getStatus();
  const installed = tunnel.isInstalled();
  const primaryKey = cfg.clients && cfg.clients[0] ? cfg.clients[0].key : '';

  const body = `
    <p class="muted">Expose Loka ke internet pakai Cloudflare Tunnel (gratis, HTTPS, tanpa buka router).</p>

    <h2>Local Network</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Interface</th><th>URL</th><th></th></tr>
        ${ips.map(i => `
          <tr>
            <td><b>${i.iface}</b></td>
            <td><code>http://${i.ip}:${cfg.port}</code></td>
            <td><button type="button" class="sm ghost" onclick="copyText('http://${i.ip}:${cfg.port}')">Copy</button></td>
          </tr>
        `).join('') || '<tr><td colspan="3" class="dim">Tidak ada LAN</td></tr>'}
      </table>
    </div>

    <h2>Cloudflare Tunnel</h2>
    <div id="tunnelBox" class="tcard">
      <div class="theader">
        <span id="tunnelStatusPill" class="pill dim">loading...</span>
        <span class="muted" style="font-size:.8rem" id="tunnelInfo"></span>
      </div>

      <div id="tunnelUrlBox" style="display:none;margin-top:1rem">
        <div class="url-box">
          <span class="label">Public URL</span>
          <code id="tunnelUrl">-</code>
          <button type="button" class="sm ghost" id="btnCopyUrl">Copy</button>
        </div>
      </div>

      <div id="tunnelActions" style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap"></div>
    </div>

    <h2>Alternatif</h2>
    <div class="tcard">
      <h3>Ngrok</h3>
      <pre>pkg install ngrok
ngrok config add-authtoken YOUR_TOKEN
ngrok http ${cfg.port}</pre>
    </div>

    <style>
      .tcard{background:#fff;border:1px solid #e1e4e8;border-radius:12px;padding:1.25rem;margin-top:.75rem}
      .theader{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
    </style>

    <script>
      var AUTH = '${primaryKey}';

      function copyText(t){navigator.clipboard.writeText(t).then(function(){toast('Copied: '+t)})}

      function setStatus(status) {
        var p = document.getElementById('tunnelStatusPill');
        var info = document.getElementById('tunnelInfo');
        p.className = 'pill ' + (
          status.status === 'running' ? 'ok' :
          status.status === 'error' ? 'err' :
          status.status === 'installing' || status.status === 'starting' ? 'warn' :
          'dim'
        );
        p.textContent = status.status;
        info.textContent = status.lastError ? status.lastError.slice(0,120) : '';
      }

      function renderActions(status) {
        var box = document.getElementById('tunnelActions');
        var html = '';
        if (!status.installed) {
          html += '<button type="button" class="primary" id="btnSetup">Setup Cloudflare Tunnel</button>';
        } else if (status.status === 'running') {
          html += '<button type="button" class="danger" id="btnStop">Stop Tunnel</button>';
          html += '<button type="button" class="ghost" id="btnReinstall">Reinstall cloudflared</button>';
        } else if (status.status === 'installing' || status.status === 'starting') {
          html += '<button type="button" disabled>Working...</button>';
        } else {
          html += '<button type="button" class="primary" id="btnStart">Start Tunnel</button>';
          html += '<button type="button" class="ghost" id="btnReinstall">Reinstall cloudflared</button>';
        }
        box.innerHTML = html;

        var bSetup = document.getElementById('btnSetup');
        if (bSetup) bSetup.onclick = setupTunnel;
        var bStart = document.getElementById('btnStart');
        if (bStart) bStart.onclick = startTunnel;
        var bStop = document.getElementById('btnStop');
        if (bStop) bStop.onclick = stopTunnel;
        var bReinstall = document.getElementById('btnReinstall');
        if (bReinstall) bReinstall.onclick = reinstallTunnel;
      }

      function showUrl(status) {
        var box = document.getElementById('tunnelUrlBox');
        if (status.status === 'running' && status.url) {
          box.style.display = 'block';
          document.getElementById('tunnelUrl').textContent = status.url;
          document.getElementById('btnCopyUrl').onclick = function(){ copyText(status.url) };
        } else {
          box.style.display = 'none';
        }
      }

      async function refresh() {
        try {
          var r = await fetch('/api/tunnel/status', {headers:{'Authorization':'Bearer '+AUTH}});
          var s = await r.json();
          setStatus(s);
          showUrl(s);
          renderActions(s);
        } catch(e) { console.error(e); }
      }

      async function setupTunnel() {
        if (!window.dialog.confirm('Setup Cloudflare Tunnel?\\n\\nLoka akan download cloudflared (~30MB) dari GitHub.\\nProses ini butuh koneksi internet.')) return;
        toast('Downloading cloudflared...');
        renderActions({status: 'installing', installed: false});
        try {
          var r = await fetch('/api/tunnel/setup', {method:'POST', headers:{'Authorization':'Bearer '+AUTH}});
          var d = await r.json();
          if (d.ok) {
            toast('Cloudflared installed');
            if (window.dialog.confirm('Install selesai. Start tunnel sekarang?')) {
              startTunnel();
            } else {
              refresh();
            }
          } else {
            toast('Failed: ' + (d.error || 'unknown'));
            refresh();
          }
        } catch(e) {
          toast('Error: ' + e.message);
          refresh();
        }
      }

      async function startTunnel() {
        toast('Starting tunnel...');
        renderActions({status: 'starting', installed: true});
        try {
          var r = await fetch('/api/tunnel/start', {method:'POST', headers:{'Authorization':'Bearer '+AUTH}});
          var d = await r.json();
          if (d.ok) {
            toast('Tunnel running: ' + d.url);
            refresh();
          } else {
            toast('Failed: ' + (d.error || 'unknown'));
            refresh();
          }
        } catch(e) {
          toast('Error: ' + e.message);
          refresh();
        }
      }

      async function stopTunnel() {
        if (!window.dialog.confirm('Stop tunnel?')) return;
        await fetch('/api/tunnel/stop', {method:'POST', headers:{'Authorization':'Bearer '+AUTH}});
        toast('Stopped');
        refresh();
      }

      async function reinstallTunnel() {
        if (!window.dialog.confirm('Hapus cloudflared dan download ulang?')) return;
        await fetch('/api/tunnel/uninstall', {method:'POST', headers:{'Authorization':'Bearer '+AUTH}});
        refresh();
      }

      refresh();
      setInterval(refresh, 5000);
    </script>
  `;

  return layout('Tunnel', body, { active: '/tunnel' });
}