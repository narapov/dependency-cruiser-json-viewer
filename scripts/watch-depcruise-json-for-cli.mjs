#!/usr/bin/env node
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import chokidar from 'chokidar';

const execAsync = promisify(exec);

const DEPCRUISE_DEBOUNCE_MS = 300;

let depcruiseTimer;
let depcruiseRunning = false;
let depcruiseQueued = false;

async function runDepcruise() {
  if (depcruiseRunning) {
    depcruiseQueued = true;
    return;
  }
  depcruiseRunning = true;
  try {
    await execAsync('npm run depcruise:json-for-cli');
    console.log('[depcruise:json-for-cli:watch] regenerated test-data/cruise-result.json');
  } catch (error) {
    console.error('[depcruise:json-for-cli:watch] depcruise:json-for-cli failed:', error);
  } finally {
    depcruiseRunning = false;
    if (depcruiseQueued) {
      depcruiseQueued = false;
      void runDepcruise();
    }
  }
}

function scheduleDepcruise() {
  if (depcruiseTimer != null) {
    clearTimeout(depcruiseTimer);
  }
  depcruiseTimer = setTimeout(() => {
    depcruiseTimer = undefined;
    void runDepcruise();
  }, DEPCRUISE_DEBOUNCE_MS);
}

const srcDir = path.resolve('src');
const srcWatcher = chokidar.watch(srcDir, {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
});

srcWatcher.on('all', eventName => {
  if (eventName === 'add' || eventName === 'change' || eventName === 'unlink') {
    scheduleDepcruise();
  }
});

console.log(`[depcruise:json-for-cli:watch] watching ${srcDir}`);
