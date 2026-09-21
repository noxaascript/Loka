import { callOpenAI, callOpenAIStream } from './openai.js';
import { callAnthropic } from './anthropic.js';
import { callGemini } from './gemini.js';
import { callOllama } from './ollama.js';
import { callCodex } from './codex.js';

export const CALLERS = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  gemini: callGemini,
  ollama: callOllama,
  'openai-codex': callCodex
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