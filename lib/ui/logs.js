import { existsSync, readFileSync } from 'fs';
import { layout } from './layout.js';

const FILE = './data/logs.ndjson';

export function renderLogs() {
  let lines = [];
  if (existsSync(FILE)) {
    try {
      lines = readFileSync(FILE, 'utf-8').trim().split('\n').slice(-200).reverse();
    } catch {}
  }

  const rows = lines.map(l => {
    try {
      const e = JSON.parse(l);
      const cls = e.level === 'error' ? 'err' : e.level === 'warn' ? 'warn' : 'ok';
      const meta = { ...e };
      delete meta.ts; delete meta.level; delete meta.msg;
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `<tr>
        <td class="dim"><small>${e.ts?.slice(11, 19) || ''}</small></td>
        <td><span class="pill ${cls}">${e.level}</span></td>
        <td>${e.msg}</td>
        <td class="muted"><small>${metaStr}</small></td>
      </tr>`;
    } catch { return ''; }
  }).join('');

  const body = `
    <div class="toolbar">
      <span class="muted">200 log terbaru</span>
      <div class="spacer"></div>
      <button class="ghost" onclick="location.reload()">Refresh</button>
    </div>
    <table>
      <tr><th>Jam</th><th>Level</th><th>Pesan</th><th>Meta</th></tr>
      ${rows || '<tr><td colspan="4" class="dim">Belum ada log</td></tr>'}
    </table>
  `;

  return layout('Logs', body, { active: '/logs', refresh: 5 });
}
