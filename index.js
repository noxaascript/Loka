import { loadConfig, getConfig, watchConfig, getConfigPath } from './lib/config.js';
import { setLogLevel, log } from './lib/logger.js';
import { startServer } from './lib/server.js';
import { startKeeper } from './lib/oauth/keeper.js';
import { autoStart } from './lib/tunnel.js';

loadConfig();
setLogLevel(getConfig().logLevel || 'info');

watchConfig(null, () => {
  log.info('config reloaded');
  setLogLevel(getConfig().logLevel || 'info');
});

console.log('[config] path:', getConfigPath());

startKeeper(() => getConfig());
startServer();

// Auto-start tunnel setelah 3 detik
setTimeout(() => {
  const cfg = getConfig();
  // Cek config: kalau autoTunnel dimatikan, skip
  if (cfg.autoTunnel === false) {
    console.log('[tunnel] auto-start disabled di config');
    return;
  }
  autoStart(cfg.port).then((result) => {
    if (result && result.url) {
      console.log('[tunnel] running at:', result.url);
    }
  }).catch((e) => {
    console.log('[tunnel] auto-start error:', e.message);
  });
}, 3000);