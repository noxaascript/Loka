import { requireClient } from '../auth.js';
import { routeChat } from '../router.js';
import { getConfig } from '../config.js';
import { toOpenAIFromAnthropic, toAnthropicFromOpenAI } from './messages-translate.js';

export async function handleMessages(req, res, body) {
  const cfg = getConfig();
  requireClient(req);

  try {
    const openaiBody = toOpenAIFromAnthropic(body);
    const result = await routeChat(cfg.providers, openaiBody, cfg);
    const anthropicResp = toAnthropicFromOpenAI(result);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Loka-Provider': result._loka?.provider || 'unknown'
    });
    res.end(JSON.stringify(anthropicResp));
  } catch (err) {
    const attempts = err.attempts || [];
    const msg = attempts.length
      ? 'All providers failed:\n' + attempts.map(a => '  - ' + a.provider + ': ' + a.error).join('\n')
      : err.message;
    res.writeHead(503, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      type: 'error',
      error: {
        type: 'api_error',
        message: msg
      }
    }));
  }
}