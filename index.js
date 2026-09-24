import { loadConfig, getConfig, watchConfig, getConfigPath } from './lib/config.js';
import { setLogLevel, log } from './lib/logger.js';
import { startServer } from './lib/server.js';
import { startKeeper } from './lib/oauth/keeper.js';
import { autoStart } from './lib/tunnel.js';
import { startUpdateChecker, printUpdateBanner, getUpdateState } from './lib/update-checker.js';
import { getVersion } from './lib/version.js';

loadConfig();
setLogLevel(getConfig().logLevel || 'info');

watchConfig(null, () => {
  log.info('config reloaded');
  setLogLevel(getConfig().logLevel || 'info');
});

console.log('[config] path:', getConfigPath());

const ver = getVersion();
console.log('[loka] version:', ver.display);

startKeeper(() => getConfig());
startServer();

// Auto-start tunnel
setTimeout(() => {
  const cfg = getConfig();
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

// Start update checker
startUpdateChecker();

// Print banner update kalau ada (cek sekali lagi setelah 8 detik)
setTimeout(() => {
  if (getUpdateState().updateAvailable) {
    printUpdateBanner();
  }
}, 8000);