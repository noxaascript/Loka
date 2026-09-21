import { loadConfig, getConfig, watchConfig } from './lib/config.js';
import { setLogLevel, log } from './lib/logger.js';
import { startServer } from './lib/server.js';

loadConfig('./loka.json');
setLogLevel(getConfig().logLevel || 'info');

watchConfig('./loka.json', () => {
  log.info('config reloaded');
  setLogLevel(getConfig().logLevel || 'info');
});

startServer();
