import { requireClient } from '../auth.js';
import { routeChat } from '../router.js';
import { getConfig } from '../config.js';
import { allow } from '../ratelimit.js';
import { toOpenAIFromAnthropic, toAnthropicFromOpenAI } from './messages-translate.js';

export async function handleMessages(req, res, body) {
  const cfg = getConfig();
  const client = requireClient(req);

  if (cfg.rateLimit?.enabled) {
    const r = allow(client.key, {
      windowMs: cfg.rateLimit.windowMs,
      max: cfg.rateLimit.maxRequests
    });
    if (!r.ok) {
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': String(r.retryAfter),
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        type: 'error',
        error: { message: 'Rate limit. Coba lagi ' + r.retryAfter + 's', type: 'rate_limit_error' }
      }));
    }
  }

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