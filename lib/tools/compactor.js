const DEFAULT_KEEP_RECENT = 8;
const DEFAULT_MAX_TOKENS = 8000;
const DEFAULT_MAX_CHARS = 160;

// Estimasi token dari satu pesan (heuristik: ~4 char / token)
export function estTokens(message) {
  return Math.ceil(JSON.stringify(message || {}).length / 4);
}

export function estTokensAll(messages) {
  return (Array.isArray(messages) ? messages : []).reduce((s, m) => s + estTokens(m), 0);
}

function contentText(message) {
  if (!message || !message.content) return '';
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .filter(c => c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string')
      .map(c => c.text)
      .join(' ');
  }
  return '';
}

function clip(s, n) {
  if (!s || s.length <= n) return s;
  const cut = s.slice(0, n);
  const at = cut.lastIndexOf(' ');
  return (at > n * 0.6 ? cut.slice(0, at) : cut) + '…';
}

// Bikin versi padet dari pesan lama (batasi tiap konten text, jaga role & struktur)
function compactMessage(message, maxChars) {
  const text = contentText(message);
  const c = clip(text, maxChars);
  if (c === text) return message;

  if (typeof message.content === 'string') {
    return { ...message, content: c };
  }
  if (Array.isArray(message.content)) {
    return {
      ...message,
      content: message.content.map(x =>
        x && typeof x === 'object' && x.type === 'text' ? { ...x, text: c } : x
      )
    };
  }
  return message;
}

// Pisah history: head (system pembuka utuh) + middle + recent (N terakhir utuh)
export function splitHistory(messages, keepRecent) {
  const head = [];
  for (const m of messages) {
    if (m && m.role === 'system') head.push(m);
    else break;
  }
  const body = messages.slice(head.length);
  const recent = body.slice(-keepRecent);
  const middle = body.slice(0, body.length - keepRecent);
  return { head, middle, recent };
}

// Kompak history bila kepanjangan (diukur dari estimasi token).
// Selalu jalan di tiap request — "token saver everytime".
export function compactHistory(messages, opts = {}) {
  const keepRecent = opts.keepRecent ?? DEFAULT_KEEP_RECENT;
  const maxTokensEst = opts.maxTokensEst ?? DEFAULT_MAX_TOKENS;
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;

  if (!Array.isArray(messages) || !messages.length) {
    return { messages: (messages || []), inputTokens: 0, outputTokens: 0, savedTokens: 0, ratio: 0, mode: 'none', middle: [], recent: [], head: [] };
  }

  const inputTokens = estTokensAll(messages);
  if (messages.length <= keepRecent || inputTokens <= maxTokensEst) {
    return { messages: [...messages], inputTokens, outputTokens: inputTokens, savedTokens: 0, ratio: 0, mode: 'none', ...splitHistory(messages, keepRecent) };
  }

  const { head, middle, recent } = splitHistory(messages, keepRecent);
  if (!middle.length) {
    return { messages: [...messages], inputTokens, outputTokens: inputTokens, savedTokens: 0, ratio: 0, mode: 'none', head, middle, recent };
  }

  const after = [...head, ...middle.map(m => compactMessage(m, maxChars)), ...recent];
  const outputTokens = estTokensAll(after);
  const savedTokens = Math.max(0, inputTokens - outputTokens);

  return {
    messages: after,
    inputTokens,
    outputTokens,
    savedTokens,
    ratio: inputTokens ? savedTokens / inputTokens : 0,
    mode: 'digest',
    head,
    middle,
    recent,
    keepRecent,
    maxTokensEst
  };
}

// Ringkasan LLM jadi blok system (fitur AI: ringkas bagian lama beneran)
export function buildSummaryMessage(middle, summary) {
  const role = middle.length && middle[0].role === 'user' ? 'user' : 'system';
  return {
    role,
    content: '[Loka] Ringkasan sesi sebelumnya (' + middle.length + ' pesan):\n' + (summary || '').trim()
  };
}

// Hitung ulang hasil final setelah summarize
export function summarizeResult(inputTokens, messages) {
  const outputTokens = estTokensAll(messages);
  const savedTokens = Math.max(0, inputTokens - outputTokens);
  return {
    messages,
    outputTokens,
    savedTokens,
    ratio: inputTokens ? savedTokens / inputTokens : 0,
    mode: 'summary'
  };
}