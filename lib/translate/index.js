export { toAnthropic } from './toAnthropic.js';
export { fromAnthropic } from './fromAnthropic.js';
export { toGemini } from './toGemini.js';
export { fromGemini } from './fromGemini.js';

export const TRANSLATORS = {
  'openai:anthropic': { to: 'toAnthropic', from: 'fromAnthropic' },
  'openai:gemini': { to: 'toGemini', from: 'fromGemini' },
  'anthropic:openai': { to: 'toAnthropic', from: 'fromAnthropic' },
  'gemini:openai': { to: 'toGemini', from: 'fromGemini' }
};
