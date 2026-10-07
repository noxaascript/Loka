export function toMarkdown(bug) {
  if (!bug) return '';
  const lines = [];
  lines.push('# Bug Report: ' + bug.fp);
  lines.push('');
  lines.push('- First seen: ' + new Date(bug.firstSeen).toISOString());
  lines.push('- Last seen: ' + new Date(bug.lastSeen).toISOString());
  lines.push('- Count: ' + bug.count);
  lines.push('- Status: ' + bug.status);
  lines.push('');
  const s = bug.sample || {};
  lines.push('## Sample Error');
  lines.push('');
  lines.push('```');
  lines.push(s.message || '(no message)');
  if (s.stack) { lines.push(''); lines.push(s.stack); }
  lines.push('```');
  lines.push('');
  lines.push('## Context');
  lines.push('');
  lines.push('- Route: ' + (s.route || '-'));
  lines.push('- Provider: ' + (s.provider || '-'));
  lines.push('- Model: ' + (s.model || '-'));
  lines.push('- Status: ' + (s.status || '-'));
  if (s.requestBody) {
    lines.push('');
    lines.push('## Request Body');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(s.requestBody, null, 2).slice(0, 4000));
    lines.push('```');
  }
  return lines.join('\n');
}

export async function sendWebhook(url, bug) {
  if (!url) return { ok: false, error: 'no webhook url' };
  const payload = {
    fp: bug.fp,
    message: (bug.sample && bug.sample.message) || '',
    count: bug.count,
    firstSeen: bug.firstSeen,
    lastSeen: bug.lastSeen,
    route: (bug.sample && bug.sample.route) || '',
    provider: (bug.sample && bug.sample.provider) || '',
    model: (bug.sample && bug.sample.model) || ''
  };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export function draftIssue(bug) {
  const title = '[bug] ' + ((bug.sample && bug.sample.message) || bug.fp).slice(0, 80);
  const body = toMarkdown(bug);
  return { title, body };
}
