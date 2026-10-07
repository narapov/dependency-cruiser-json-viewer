#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import chokidar from 'chokidar';
import handler from 'serve-handler';
import { Server as SocketIoServer } from 'socket.io';

const DEFAULT_PORT = 7347;
const MAX_PORT = 65535;
const DEFAULT_HOST = 'localhost';
const CRUISE_RESULT_CHANGED_EVENT = 'cruise-result:changed';
const CRUISE_RESULT_SOCKET_PATH = '/api/cruise-result-socket.io';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: { type: 'string', short: 'p' },
    host: { type: 'string', short: 'h' },
    watch: { type: 'boolean', short: 'w' },
    'workspace-settings': { type: 'string' },
    help: { type: 'boolean' },
  },
  allowPositionals: true,
});

function printUsage() {
  console.error(
    `Usage: dependency-cruiser-json-viewer <path-to-cruise-result.json> [--port <number>] [--host <host>] [--watch] [--workspace-settings <path>]

Options:
  --port, -p              HTTP port (default: ${DEFAULT_PORT})
  --host, -h              Bind host (default: ${DEFAULT_HOST})
  --watch, -w             Watch cruise JSON and notify the UI to reload
  --workspace-settings    Path to a saved workspace JSON applied once on startup (not watched)
`,
  );
}

/**
 * @param {string} filePath
 * @param {string} label
 */
function assertJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${label} file not found: ${filePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    console.error(`Error: ${label} is not a file: ${filePath}`);
    process.exit(1);
  }

  if (!filePath.endsWith('.json')) {
    console.error(`Error: expected a .json file for ${label}: ${filePath}`);
    process.exit(1);
  }
}

if (values.help || positionals.length === 0) {
  printUsage();
  process.exit(values.help ? 0 : 1);
}

const cruiseJsonPath = path.resolve(positionals[0]);
const watchMode = values.watch === true;
const workspaceSettingsPath = values['workspace-settings'] != null ? path.resolve(values['workspace-settings']) : null;
const initialWorkspaceSettings = workspaceSettingsPath != null;

assertJsonFile(cruiseJsonPath, 'cruise result');

if (workspaceSettingsPath != null) {
  assertJsonFile(workspaceSettingsPath, 'workspace settings');
}

const portExplicit = values.port !== undefined;
const port = portExplicit ? Number(values.port) : DEFAULT_PORT;
if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) {
  console.error(`Error: invalid port: ${values.port ?? ''}`);
  process.exit(1);
}

const host = values.host ?? DEFAULT_HOST;
/** @type {number} */
let listenPort = port;

/** URL for the bound listen address (IPv6 host wrapped in brackets). */
function listenUrl() {
  const hostForUrl = host.includes(':') ? `[${host}]` : host;
  return `http://${hostForUrl}:${listenPort}`;
}

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist');

if (!fs.existsSync(distDir)) {
  console.error(`Error: dist directory not found at ${distDir}. Run npm run build first.`);
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', listenUrl());

  if (pathname === '/envs.js') {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.end(`window.envs = { watch: ${watchMode}, initialWorkspaceSettings: ${initialWorkspaceSettings} };\n`);
    return;
  }

  if (pathname === '/cruise-result.json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    fs.createReadStream(cruiseJsonPath).pipe(res);
    return;
  }

  if (pathname === '/workspace-settings.json') {
    if (workspaceSettingsPath == null) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    fs.createReadStream(workspaceSettingsPath).pipe(res);
    return;
  }

  await handler(req, res, {
    public: distDir,
    rewrites: [{ source: '**', destination: '/index.html' }],
  });
});

/** @type {import('socket.io').Server | undefined} */
let io;

if (watchMode) {
  io = new SocketIoServer(server, { path: CRUISE_RESULT_SOCKET_PATH });
  const cruiseJsonWatcher = chokidar.watch(cruiseJsonPath, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });
  cruiseJsonWatcher.on('all', eventName => {
    if (eventName === 'add' || eventName === 'change') {
      io?.emit(CRUISE_RESULT_CHANGED_EVENT);
    }
  });
  server.on('close', () => {
    void cruiseJsonWatcher.close();
    void io?.close();
  });
}

/**
 * @param {number} busyPort
 * @returns {never}
 */
function exitPortInUse(busyPort) {
  console.error(`Error: port ${busyPort} is already in use`);
  process.exit(1);
}

/**
 * @returns {never}
 */
function exitNoFreePort() {
  console.error(`Error: no free port found between ${DEFAULT_PORT + 1} and ${MAX_PORT}`);
  process.exit(1);
}

/**
 * @returns {Promise<boolean>}
 */
function askUseNextFreePort() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    const finish = accepted => {
      rl.close();
      resolve(accepted);
    };

    rl.once('SIGINT', () => {
      finish(false);
    });

    rl.question(`Port ${DEFAULT_PORT} is in use. Use next free port? [Y/n] `, answer => {
      const normalized = answer.trim().toLowerCase();
      finish(normalized === '' || normalized === 'y' || normalized === 'yes');
    });
  });
}

function onListening() {
  const watchSuffix = watchMode ? ' (watch)' : '';
  console.log(`dependency-cruiser-json-viewer is running at ${listenUrl()}${watchSuffix}`);
}

/**
 * @param {number} candidatePort
 */
function listenOn(candidatePort) {
  listenPort = candidatePort;
  server.listen(candidatePort, host, onListening);
}

function listenOnNextCandidate() {
  const candidatePort = listenPort + 1;
  if (candidatePort > MAX_PORT) {
    exitNoFreePort();
  }
  // listen(..., cb) registers once('listening'); a failed bind leaves it attached.
  server.removeListener('listening', onListening);
  listenOn(candidatePort);
}

/**
 * @param {NodeJS.ErrnoException} err
 */
async function handleServerError(err) {
  if (err.code !== 'EADDRINUSE') {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (portExplicit) {
    exitPortInUse(listenPort);
  }

  // Already recovering past the default: keep scanning without prompting again.
  if (listenPort !== DEFAULT_PORT) {
    listenOnNextCandidate();
    return;
  }

  if (!process.stdin.isTTY) {
    exitPortInUse(listenPort);
  }

  const accepted = await askUseNextFreePort();
  if (!accepted) {
    exitPortInUse(DEFAULT_PORT);
  }

  listenOnNextCandidate();
}

server.on('error', err => {
  void handleServerError(err);
});

listenOn(port);
