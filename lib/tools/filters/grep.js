export function filterGrep(text, maxResults = 100) {
  const lines = text.split('\n');
  if (lines.length <= maxResults) return text;
  return lines.slice(0, maxResults).join('\n')
    + `\n... [${lines.length - maxResults} baris lagi dipotong oleh Loka RTK]`;
}
