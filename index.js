import { loadConfig, getConfig, watchConfig, getConfigPath } from './lib/config.js';
import { setLogLevel, log } from './lib/logger.js';
import { startServer } from './lib/server.js';
import { startKeeper } from './lib/oauth/keeper.js';
import { autoStart } from './lib/tunnel.js';
import { startUpdateChecker, printUpdateBanner, getUpdateState } from './lib/update-checker.js';
import { autoInstallMissingTools } from './lib/tools/auto-install.js';

loadConfig();
setLogLevel(getConfig().logLevel || 'info');

watchConfig(null, () => {
  log.info('config reloaded');
  setLogLevel(getConfig().logLevel || 'info');
});

startKeeper(() => getConfig());
const server = startServer();

server.once('listening', async () => {
  const cfg = getConfig();
  const primaryKey = (cfg.clients && cfg.clients[0] && cfg.clients[0].key) || '-';

  process.stdout.write('\x1b[2J\x1b[H');

  console.log('Loka AI Router');
  console.log('--------------------------------');
  console.log('Endpoint  : http://localhost:' + cfg.port + '/v1');
  console.log('Dashboard : http://localhost:' + cfg.port + '/');
  console.log('API Key   : ' + primaryKey);
  console.log('');

  await autoInstallMissingTools();

  startUpdateChecker();
  await new Promise(r => setTimeout(r, 1500));

  const st = getUpdateState();
  if (st && st.updateAvailable) {
    printUpdateBanner();
    console.log('');
  }

  if (cfg.autoTunnel === false) {
    console.log('[tunnel] auto-start disabled di config');
    return;
  }

  try {
    const result = await autoStart(cfg.port);
    if (result && result.url) {
      console.log('[tunnel] running at:', result.url);
    }
  } catch (e) {
    console.log('[tunnel] auto-start error:', e.message);
  }
});
