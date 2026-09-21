export function toOpenAIFromAnthropic(body) {
  const messages = [];
  if (body.system) {
    messages.push({ role: 'system', content: body.system });
  }
  for (const m of body.messages || []) {
    let content = '';
    if (typeof m.content === 'string') content = m.content;
    else if (Array.isArray(m.content)) {
      content = m.content.filter(c => c.type === 'text').map(c => c.text).join('');
    }
    messages.push({ role: m.role, content });
  }
  return {
    model: body.model,
    messages,
    max_tokens: body.max_tokens,
    temperature: body.temperature,
    top_p: body.top_p,
    stop: body.stop_sequences
  };
}

export function toAnthropicFromOpenAI(resp) {
  const choice = resp.choices?.[0];
  const text = choice?.message?.content || '';
  return {
    id: resp.id || 'msg_' + Date.now(),
    type: 'message',
    role: 'assistant',
    model: resp.model,
    content: [{ type: 'text', text }],
    stop_reason: choice?.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
    usage: {
      input_tokens: resp.usage?.prompt_tokens || 0,
      output_tokens: resp.usage?.completion_tokens || 0
    },
    _loka: resp._loka
  };
}
