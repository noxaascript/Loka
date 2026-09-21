export function compactHistory(messages, { keepRecent = 10, maxTokensEst = 6000 } = {}) {
  if (messages.length <= keepRecent) return messages;

  const est = (m) => Math.ceil(JSON.stringify(m).length / 4);
  const total = messages.reduce((s, m) => s + est(m), 0);
  if (total <= maxTokensEst) return messages;

  const head = messages.slice(0, 1);
  const recent = messages.slice(-keepRecent);
  const middle = messages.slice(1, -keepRecent);

  const summary = {
    role: 'system',
    content: `[Loka: ${middle.length} pesan sebelumnya diringkas]`
  };

  return [...head, summary, ...recent];
}
