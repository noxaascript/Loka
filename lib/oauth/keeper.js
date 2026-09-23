import { loadToken, saveToken, listTokens } from './store.js';
import { ensureFreshToken } from './refresh.js';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 menit
const REFRESH_THRESHOLD = 15 * 60 * 1000; // refresh kalau <15 menit

let timer = null;

async function checkAllTokens(cfg) {
  if (!cfg || !cfg.providers) return;

  for (const provider of cfg.providers) {
    if (!provider.apiKeys?.includes('oauth')) continue;
    if (provider.status !== 'ready') continue;

    const token = loadToken(provider.id);
    if (!token) continue;
    if (!token.refreshToken) continue;

    const remainsMs = (token.expiresAt || 0) - Date.now();

    if (remainsMs < REFRESH_THRESHOLD) {
      try {
        console.log('[keeper] ' + provider.id + ': token expires in ' + Math.round(remainsMs / 60000) + 'm, refreshing...');
        await ensureFreshToken(provider.id, provider.type);
        console.log('[keeper] ' + provider.id + ': refreshed');
      } catch (e) {
        console.error('[keeper] ' + provider.id + ': refresh failed - ' + e.message);
      }
    }
  }
}

export function startKeeper(getCfg) {
  if (timer) return;
  console.log('[keeper] started, interval ' + (CHECK_INTERVAL / 60000) + 'm');

  // Cek pertama kali setelah 10 detik (biar server siap dulu)
  setTimeout(() => checkAllTokens(getCfg()), 10000);

  timer = setInterval(() => {
    checkAllTokens(getCfg());
  }, CHECK_INTERVAL);
}

export function stopKeeper() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}