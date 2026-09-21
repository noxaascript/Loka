import { getConfig } from '../config.js';
import { layout } from './layout.js';

function redactKeys(cfg) {
  const copy = JSON.parse(JSON.stringify(cfg));
  for (const p of copy.providers || []) {
    if (Array.isArray(p.apiKeys)) p.apiKeys = p.apiKeys.map(() => '***');
  }
  return copy;
}

export function renderSettings() {
  const cfg = getConfig();
  const safe = redactKeys(cfg);

  const body = `
    <h2>Server</h2>
    <div class="card">
      <div class="row"><span>Port</span><span><code>${cfg.port}</code></span></div>
      <div class="row"><span>Host</span><span><code>${cfg.host}</code></span></div>
      <div class="row"><span>Request Timeout</span><span>${cfg.requestTimeoutMs}ms</span></div>
      <div class="row"><span>Max Retries</span><span>${cfg.maxRetries}</span></div>
      <div class="row"><span>Cooldown</span><span>${cfg.cooldownMs}ms</span></div>
      <div class="row"><span>Log Level</span><span>${cfg.logLevel}</span></div>
    </div>

    <h2>Fitur</h2>
    <div class="card">
      <div class="row"><span>Cache</span><span>${cfg.cache?.enabled ? '<span class="pill ok">on</span>' : '<span class="pill dim">off</span>'}</span></div>
      <div class="row"><span>TTL Cache</span><span>${cfg.cache?.ttlMs}ms</span></div>
      <div class="row"><span>Rate Limit</span><span>${cfg.rateLimit?.enabled ? '<span class="pill ok">on</span>' : '<span class="pill dim">off</span>'}</span></div>
      <div class="row"><span>Max Request</span><span>${cfg.rateLimit?.maxRequests} / ${(cfg.rateLimit?.windowMs || 0) / 1000}s</span></div>
      <div class="row"><span>RTK Token Saver</span><span>${cfg.rtk?.enabled ? '<span class="pill ok">on</span>' : '<span class="pill dim">off</span>'}</span></div>
    </div>

    <h2>Aksi</h2>
    <div class="toolbar">
      <button onclick="reloadConfig()">Reload Config</button>
      <button class="ghost" onclick="clearCache()">Clear Cache</button>
      <button class="ghost" onclick="clearCooldowns()">Clear All Cooldowns</button>
    </div>

    <h2>Raw Config</h2>
    <p class="dim">API key disembunyikan untuk keamanan.</p>
    <pre>${JSON.stringify(safe, null, 2)}</pre>

    <script>
      async function api(path) {
        const r = await fetch(path, {
          headers: { 'Authorization': 'Bearer loka-local' }
        });
        return r.json();
      }
      async function reloadConfig() {
        await api('/admin/reload');
        toast('Config reloaded');
        setTimeout(() => location.reload(), 500);
      }
      async function clearCache() {
        await api('/admin/cache/clear');
        toast('Cache cleared');
      }
      async function clearCooldowns() {
        await api('/admin/cooldown/clear');
        toast('Cooldowns cleared');
        setTimeout(() => location.reload(), 500);
      }
    </script>
  `;

  return layout('Settings', body, { active: '/settings' });
}
