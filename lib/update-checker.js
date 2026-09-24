import { checkPackage, LOKA_PACKAGE } from './updater.js';
import { log } from './logger.js';

const CHECK_INTERVAL = 30 * 60 * 1000; // 30 menit
const INITIAL_DELAY = 5000;             // 5 detik setelah start

let state = {
  checking: false,
  latest: null,
  installed: null,
  updateAvailable: false,
  error: null,
  lastChecked: null
};

let timer = null;

export function getUpdateState() {
  return { ...state };
}

async function doCheck() {
  if (state.checking) return;
  state.checking = true;

  try {
    const result = await checkPackage(LOKA_PACKAGE);
    state.installed = result.installed;
    state.latest = result.latest;
    state.updateAvailable = Boolean(result.updateAvailable);
    state.error = result.error || null;
    state.lastChecked = new Date().toISOString();

    if (state.updateAvailable) {
      log.warn('UPDATE AVAILABLE: ' + result.installed + '  ' + result.latest);
    } else if (result.installed) {
      log.info('Loka up-to-date: ' + result.installed);
    }
  } catch (e) {
    state.error = e.message;
  } finally {
    state.checking = false;
  }
}

export function startUpdateChecker() {
  if (timer) return;

  // Cek pertama setelah delay (biar server sempat start)
  setTimeout(() => {
    doCheck().then(() => {
      if (state.updateAvailable) {
        printUpdateBanner();
      }
    });
  }, INITIAL_DELAY);

  // Cek berkala
  timer = setInterval(() => {
    doCheck().then(() => {
      if (state.updateAvailable) {
        printUpdateBanner();
      }
    });
  }, CHECK_INTERVAL);
}

export function stopUpdateChecker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// Print banner update di terminal
export function printUpdateBanner() {
  if (!state.updateAvailable) return;

  const RESET = '\x1b[0m';
  const BOLD = '\x1b[1m';
  const YELLOW = '\x1b[33m';
  const CYAN = '\x1b[36m';
  const DIM = '\x1b[2m';

  console.log('');
  console.log(`${YELLOW}${BOLD}    Update tersedia!${RESET}`);
  console.log(`${DIM}  ${RESET}`);
  console.log(`  Sekarang : ${DIM}${state.installed || 'unknown'}${RESET}`);
  console.log(`  Terbaru  : ${CYAN}${state.latest}${RESET}`);
  console.log('');
  console.log(`  Update: ${CYAN}npm install -g loka-ai-router@beta${RESET}`);
  console.log(`  Atau buka: ${CYAN}http://localhost:1455/cli${RESET}`);
  console.log('');
}

export async function checkNow() {
  await doCheck();
  return getUpdateState();
}