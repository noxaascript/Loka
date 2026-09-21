import { getConfig } from '../config.js';
import { getStats } from '../stats.js';
import { layout } from './layout.js';

export function renderUsage() {
  const cfg = getConfig();
  const stats = getStats();

  const providerData = cfg.providers.map(p => {
    const s = stats.providers[p.id] || { success: 0, fail: 0, tokens: 0, latencySum: 0 };
    const total = s.success + s.fail;
    const rate = total ? Math.round((s.success / total) * 100) : 0;
    const avg = s.success ? Math.round(s.latencySum / s.success) : 0;
    return { id: p.id, ...s, total, rate, avg };
  });

  const maxTokens = Math.max(...providerData.map(p => p.tokens || 0), 1);

  const rows = providerData.map(p => `
    <tr>
      <td><b>${p.id}</b></td>
      <td>${p.success}</td>
      <td>${p.fail}</td>
      <td>${p.avg}ms</td>
      <td>${(p.tokens || 0).toLocaleString()}</td>
      <td style="min-width:150px">
        <div class="bar"><div style="width:${(p.tokens / maxTokens) * 100}%"></div></div>
      </td>
      <td>
        <span class="pill ${p.rate >= 90 ? 'ok' : p.rate >= 70 ? 'warn' : 'err'}">${p.rate}%</span>
      </td>
    </tr>
  `).join('');

  const topBar = [...providerData]
    .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
    .slice(0, 5)
    .map(p => `
      <div style="margin-bottom:.75rem">
        <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.25rem">
          <span>${p.id}</span>
          <span class="muted">${(p.tokens || 0).toLocaleString()}</span>
        </div>
        <div class="bar"><div style="width:${(p.tokens / maxTokens) * 100}%"></div></div>
      </div>
    `).join('');

  const body = `
    <div class="stats-grid">
      <div class="stat">
        <div class="label">Total Request</div>
        <div class="value">${stats.totals.req.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="label">Total Token</div>
        <div class="value">${(stats.totals.tokens / 1000).toFixed(1)}K</div>
      </div>
      <div class="stat">
        <div class="label">Providers</div>
        <div class="value">${providerData.length}</div>
      </div>
      <div class="stat">
        <div class="label">Clients</div>
        <div class="value">${(cfg.clients || []).length}</div>
      </div>
    </div>

    <h2>Top 5 Provider by Tokens</h2>
    <div class="card">${topBar || '<div class="dim">Belum ada data</div>'}</div>

    <h2>Detail per Provider</h2>
    <table>
      <tr><th>Provider</th><th>OK</th><th>Fail</th><th>Avg</th><th>Tokens</th><th>Distribusi</th><th>Rate</th></tr>
      ${rows || '<tr><td colspan="7" class="dim">Belum ada data</td></tr>'}
    </table>

    <h2>Per Client</h2>
    <table>
      <tr><th>Client</th><th>Req</th><th>Tokens</th></tr>
      ${(cfg.clients || []).map(c => {
        const s = stats.clients[c.name] || { req: 0, tokens: 0 };
        return `<tr><td><b>${c.name}</b></td><td>${s.req}</td><td>${(s.tokens || 0).toLocaleString()}</td></tr>`;
      }).join('') || '<tr><td colspan="3" class="dim">Belum ada client</td></tr>'}
    </table>

    <div class="toolbar" style="margin-top:2rem">
      <button class="danger" onclick="resetStats()">Reset Semua Stats</button>
    </div>

    <script>
      async function resetStats() {
        if (!confirm('Reset semua stats? Tindakan ini tidak bisa dibatalkan.')) return;
        await fetch('/admin/stats/reset', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer loka-local' }
        });
        toast('Stats direset');
        setTimeout(() => location.reload(), 500);
      }
    </script>
  `;

  return layout('Usage', body, { active: '/usage', refresh: 15 });
}
