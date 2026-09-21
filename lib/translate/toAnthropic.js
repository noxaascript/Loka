export function toAnthropic(body, model) {
  const sys = body.messages.filter(m => m.role === 'system');
  const rest = body.messages.filter(m => m.role !== 'system');

  const messages = [];
  for (const m of rest) {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    let content;
    if (typeof m.content === 'string') {
      content = m.content;
    } else if (Array.isArray(m.content)) {
      content = m.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('');
    } else {
      content = '';
    }
    messages.push({ role, content });
  }

  const out = {
    model,
    max_tokens: body.max_tokens || 4096,
    messages
  };

  if (body.temperature != null) out.temperature = body.temperature;
  if (body.top_p != null) out.top_p = body.top_p;
  if (body.stop) {
    out.stop_sequences = Array.isArray(body.stop) ? body.stop : [body.stop];
  }
  if (sys.length) {
    out.system = sys.map(s =>
      typeof s.content === 'string' ? s.content : ''
    ).join('\n\n');
  }

  return out;
}
