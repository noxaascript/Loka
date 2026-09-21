import { requireClient } from '../auth.js';
import { routeChat, routeChatStream } from '../router.js';
import { getConfig } from '../config.js';
import { keyOf, get as cacheGet, set as cacheSet } from '../cache.js';
import { allow } from '../ratelimit.js';
import { bumpClient } from '../stats.js';
import { log } from '../logger.js';

export async function handleChat(req, res, body) {
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
        error: { message: `Rate limit. Coba lagi ${r.retryAfter}s`, type: 'rate_limit' }
      }));
    }
  }

  const wantStream = body.stream === true;

  if (wantStream) {
    return routeChatStream(cfg.providers, body, cfg, res);
  }

  if (cfg.cache?.enabled) {
    const k = keyOf(body);
    const hit = cacheGet(k);
    if (hit) {
      log.debug('cache hit', { key: k });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Loka-Cache': 'HIT'
      });
      return res.end(JSON.stringify({ ...hit, _loka: { ...hit._loka, cache: 'hit' } }));
    }
  }

  const result = await routeChat(cfg.providers, body, cfg);

  if (cfg.cache?.enabled) {
    cacheSet(keyOf(body), result, cfg.cache.ttlMs);
  }

  bumpClient(client.name, result.usage?.total_tokens || 0);

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'X-Loka-Provider': result._loka?.provider || 'unknown'
  });
  res.end(JSON.stringify(result));
}
