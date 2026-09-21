export function filterGitDiff(text, maxLines = 200) {
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;

  const kept = [];
  const hunks = [];
  let current = [];

  for (const line of lines) {
    if (line.startsWith('@@')) {
      if (current.length) hunks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) hunks.push(current);

  if (hunks[0]?.[0]) kept.push(hunks[0][0]);
  for (const h of hunks.slice(0, 3)) {
    kept.push(...h.slice(1, 20));
  }
  kept.push(`... [${lines.length - kept.length} baris diff dipotong oleh Loka RTK]`);
  return kept.join('\n');
}
