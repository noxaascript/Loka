import { loadConfig, getConfig, watchConfig, getConfigPath } from './lib/config.js';
import { setLogLevel, log } from './lib/logger.js';
import { startServer } from './lib/server.js';

loadConfig();
setLogLevel(getConfig().logLevel || 'info');

watchConfig(null, () => {
  log.info('config reloaded');
  setLogLevel(getConfig().logLevel || 'info');
});

console.log('[config] path:', getConfigPath());

startServer();