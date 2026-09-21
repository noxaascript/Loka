function mapFinish(r) {
  switch (r) {
    case 'MAX_TOKENS': return 'length';
    case 'STOP': return 'stop';
    case 'SAFETY': return 'content_filter';
    default: return 'stop';
  }
}

export function fromGemini(res) {
  const cand = res.candidates?.[0];
  const parts = cand?.content?.parts || [];
  const text = parts.map(p => p.text || '').join('');
  const usage = res.usageMetadata || {};

  const prompt = usage.promptTokenCount || 0;
  const completion = usage.candidatesTokenCount || 0;

  return {
    id: 'chatcmpl-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: res.modelVersion || 'gemini',
    choices: [{
      index: 0,
      message: { role: 'assistant', content: text },
      finish_reason: mapFinish(cand?.finishReason)
    }],
    usage: {
      prompt_tokens: prompt,
      completion_tokens: completion,
      total_tokens: usage.totalTokenCount || (prompt + completion)
    }
  };
}
