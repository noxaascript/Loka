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
  `;

  return layout('Home', body, { active: '/' });
}
