import { FILTERS } from './filters/index.js';

function autoDetect(text) {
  const head = text.slice(0, 1024);
  if (/^diff --git/m.test(head)) return 'git-diff';
  if (/^@@/m.test(head)) return 'git-diff';
  if (/^\S+:\d+:/m.test(head)) return 'grep';
  if (/^total \d+/m.test(head)) return 'ls';
  if (/^\s*[[{"]/.test(head)) return 'json';
  return null;
}

export function compressToolOutput(text, opts = {}) {
  if (typeof text !== 'string') return text;
  try {
    const kind = autoDetect(text);
    if (!kind) return text;
    const filter = FILTERS[kind];
    if (!filter) return text;
    const out = filter(text, opts);
    if (!out || out.length >= text.length) return text;
    return out;
  } catch {
    return text;
  }
}

export function compressMessages(messages, opts) {
  return messages.map(m => {
    if (m.role === 'tool' && typeof m.content === 'string') {
      return { ...m, content: compressToolOutput(m.content, opts) };
    }
    if (Array.isArray(m.content)) {
      return {
        ...m,
        content: m.content.map(c =>
          c.type === 'text' && c.text
            ? { ...c, text: compressToolOutput(c.text, opts) }
            : c
        )
      };
    }
    return m;
  });
}
