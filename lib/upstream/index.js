import { callOpenAI, callOpenAIStream } from './openai.js';
import { callAnthropic } from './anthropic.js';
import { callGemini } from './gemini.js';
import { callOllama } from './ollama.js';
import { callCodex } from './codex.js';
import { callOpenCodeZen } from './opencode-zen.js';

export const CALLERS = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
  ollama: callOllama,
  'openai-codex': callCodex,
  'opencode-zen': callOpenCodeZen
};

export const STREAMERS = {
  openai: callOpenAIStream,
  ollama: callOpenAIStream
};

export function getCaller(type) {
  return CALLERS[type] || null;
}

export function getStreamer(type) {
  return STREAMERS[type] || null;
}