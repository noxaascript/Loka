export function filterJson(text, maxChars = 8000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars)
    + `\n... [JSON ${text.length - maxChars} karakter dipotong]`;
}
