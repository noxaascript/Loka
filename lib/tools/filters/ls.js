export function filterLs(text, maxLines = 80) {
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join('\n')
    + `\n... [${lines.length - maxLines} entri lagi dipotong]`;
}
