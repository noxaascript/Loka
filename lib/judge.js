// The Judge  nilai kualitas response sebelum dikembalikan ke user.
// Heuristik dulu; opsional LLM judge kalau cfg.judge.llm = true.

const REFUSAL_PATTERNS = [
  /\bi (can'?t|cannot|won'?t) (help|assist|do|provide)/i,
  /\bi'?m (sorry|unable|not able)/i,
  /\bas an ai( language model)?/i,
  /\bi don'?t have (the )?(ability|access)/i,
  /\bthis (request|content) (violates|is not allowed)/i,
];

const ERROR_LEAK_PATTERNS = [
  /^\s*(error|exception|traceback|stack trace)\s*[:\-]/i,
  /\b(undefined is not|is not a function|null pointer|segfault)\b/i,
  /<html[^>]*>\s*<head[^>]*>.*?(error|forbidden|unavailable)/is,
];

export function judgeResponse(result, opts = {}) {
  const minLen = opts.minLength ?? 1;

  if (!result) return { ok: false, reason: 'empty_result', score: 0 };
  if (result.error) {
    return { ok: false, reason: 'error_field', score: 0, detail: String(result.error).slice(0, 150) };
  }

  // OpenAI shape: choices[0].message.content
  // Anthropic shape: content[].text
  let text = '';
  let finish = '';

  if (Array.isArray(result.choices) && result.choices.length) {
    const c = result.choices[0];
    finish = c.finish_reason || '';
    const msg = c.message || c.delta || {};
    if (typeof msg.content === 'string') text = msg.content;
    else if (Array.isArray(msg.content)) text = msg.content.map(x => x.text || '').join('');
  } else if (Array.isArray(result.content)) {
    finish = result.stop_reason || '';
    text = result.content.map(x => x.text || '').join('');
  } else if (typeof result.text === 'string') {
    text = result.text;
  }

  if (finish === 'content_filter') return { ok: false, reason: 'content_filter', score: 0 };
  if (finish === 'length') return { ok: true, reason: 'truncated_length', score: 0.6 };

  if (typeof text !== 'string') return { ok: false, reason: 'non_string_content', score: 0 };
  const trimmed = text.trim();
  if (trimmed.length < minLen) return { ok: false, reason: 'empty_content', score: 0 };

  for (const p of ERROR_LEAK_PATTERNS) {
    if (p.test(trimmed)) return { ok: false, reason: 'error_leak', score: 0.2 };
  }

  for (const p of REFUSAL_PATTERNS) {
    if (p.test(trimmed)) return { ok: false, reason: 'refusal', score: 0.3 };
  }

  // Skor naik kalau panjang wajar
  const score = trimmed.length > 40 ? 1 : 0.7;
  return { ok: true, reason: 'ok', score, length: trimmed.length };
}

// Judge via LLM (opsional)  kasih prompt ke model kecil
export async function judgeWithLLM(caller, provider, body, model, opts = {}) {
  const prompt = [
    'Rate the quality of the following assistant reply.',
    'Reply ONLY with: OK or BAD',
    'Consider: refusal to answer without cause, off-topic, empty, or obvious error text.',
    '',
    '---',
    (body && body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content) || '',
  ].join('\n');

  try {
    const r = await caller(provider, { messages: [{ role: 'user', content: prompt }] }, model, {
      timeoutMs: opts.timeoutMs || 8000,
      maxTokens: 4,
    });
    const txt = (r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || '';
    const up = String(txt).trim().toUpperCase();
    if (up.startsWith('BAD')) return { ok: false, reason: 'llm_judge_bad', score: 0.2 };
    return { ok: true, reason: 'llm_judge_ok', score: 1 };
  } catch {
    // Judge sendiri gagal  jangan block. Anggap OK.
    return { ok: true, reason: 'judge_unavailable', score: 0.5 };
  }
}
