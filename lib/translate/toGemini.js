export function toGemini(body) {
  const sys = body.messages.find(m => m.role === 'system');
  const contents = [];

  for (const m of body.messages) {
    if (m.role === 'system') continue;
    const role = m.role === 'assistant' ? 'model' : 'user';
    let text = '';
    if (typeof m.content === 'string') text = m.content;
    else if (Array.isArray(m.content)) {
      text = m.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('');
    }
    contents.push({ role, parts: [{ text }] });
  }

  const out = { contents };

  if (sys) {
    out.systemInstruction = {
      parts: [{
        text: typeof sys.content === 'string' ? sys.content : ''
      }]
    };
  }

  const gen = {};
  if (body.temperature != null) gen.temperature = body.temperature;
  if (body.max_tokens != null) gen.maxOutputTokens = body.max_tokens;
  if (body.top_p != null) gen.topP = body.top_p;
  if (body.stop) {
    gen.stopSequences = Array.isArray(body.stop) ? body.stop : [body.stop];
  }
  if (Object.keys(gen).length) out.generationConfig = gen;

  return out;
}
