export function toCodex(openaiBody) {
  const messages = openaiBody.messages || [];
  const systemMsg = messages.find(m => m.role === 'system');
  const instructions = systemMsg
    ? (typeof systemMsg.content === 'string' ? systemMsg.content : '')
    : 'You are a coding agent running in the Codex CLI, a terminal-based coding assistant. Be precise, safe, and helpful.';

  const input = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    const text = typeof m.content === 'string'
      ? m.content
      : (Array.isArray(m.content)
          ? m.content.filter(c => c.type === 'text').map(c => c.text).join('\n')
          : '');
    if (!text) continue;
    const partType = m.role === 'assistant' ? 'output_text' : 'input_text';
    input.push({
      type: 'message',
      role: m.role,
      content: [{ type: partType, text }]
    });
  }

  return {
    model: openaiBody.model || 'gpt-5.6-sol',
    instructions,
    input,
    stream: true,
    store: false,
    parallel_tool_calls: false,
    tool_choice: 'none',
    tools: [],
    reasoning: { effort: 'medium', summary: 'auto' },
    include: [],
    text: { verbosity: 'medium' }
  };
}