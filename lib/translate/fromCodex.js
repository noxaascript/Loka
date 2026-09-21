// Parse SSE stream dari Codex, convert ke format chat completion (aggregate)
export async function fromCodexStream(stream, model) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let finishReason = 'stop';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      let evt;
      try { evt = JSON.parse(payload); } catch { continue; }

      const type = evt.type;
      if (type === 'response.output_text.delta' && evt.delta) {
        fullText += evt.delta;
      } else if (type === 'response.output_item.done' && evt.item) {
        const item = evt.item;
        if (item.type === 'message' && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.type === 'output_text' && c.text && !fullText.includes(c.text)) {
              fullText += c.text;
            }
          }
        }
      } else if (type === 'response.completed' && evt.response) {
        const r = evt.response;
        if (r.usage) {
          usage.prompt_tokens = r.usage.input_tokens || 0;
          usage.completion_tokens = r.usage.output_tokens || 0;
          usage.total_tokens = r.usage.total_tokens || (usage.prompt_tokens + usage.completion_tokens);
        }
        if (r.output && Array.isArray(r.output)) {
          for (const item of r.output) {
            if (item.type === 'message' && Array.isArray(item.content)) {
              for (const c of item.content) {
                if (c.type === 'output_text' && c.text && !fullText.includes(c.text)) {
                  fullText += c.text;
                }
              }
            }
          }
        }
        if (r.status === 'incomplete') finishReason = 'length';
      }
    }
  }

  return {
    id: 'chatcmpl-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: fullText },
      finish_reason: finishReason
    }],
    usage
  };
}