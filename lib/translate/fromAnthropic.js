function mapStopReason(r) {
  switch (r) {
    case 'end_turn':
    case 'stop_sequence':
      return 'stop';
    case 'max_tokens':
      return 'length';
    case 'tool_use':
      return 'tool_calls';
    default:
      return r || 'stop';
  }
}

export function fromAnthropic(res) {
  const blocks = res.content || [];
  let text = '';
  const toolCalls = [];

  for (const block of blocks) {
    if (block.type === 'text') text += block.text || '';
    if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input || {})
        }
      });
    }
  }

  const prompt = res.usage?.input_tokens || 0;
  const completion = res.usage?.output_tokens || 0;

  const message = { role: 'assistant', content: text };
  if (toolCalls.length) message.tool_calls = toolCalls;

  return {
    id: res.id || 'chatcmpl-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: res.model || 'claude',
    choices: [{
      index: 0,
      message,
      finish_reason: mapStopReason(res.stop_reason)
    }],
    usage: {
      prompt_tokens: prompt,
      completion_tokens: completion,
      total_tokens: prompt + completion
    }
  };
}
