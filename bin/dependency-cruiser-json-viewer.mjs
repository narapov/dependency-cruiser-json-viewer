#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import chokidar from 'chokidar';
import handler from 'serve-handler';
import { Server as SocketIoServer } from 'socket.io';

const DEFAULT_PORT = 7347;
const DEFAULT_HOST = '127.0.0.1';
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

const port = values.port ? Number(values.port) : DEFAULT_PORT;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Error: invalid port: ${values.port ?? ''}`);
  process.exit(1);
}

const host = values.host ?? DEFAULT_HOST;

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist');

if (!fs.existsSync(distDir)) {
  console.error(`Error: dist directory not found at ${distDir}. Run npm run build first.`);
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', `http://localhost:${port}`);

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

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: port ${port} is already in use`);
  } else {
    console.error(`Error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  const watchSuffix = watchMode ? ' (watch)' : '';
  console.log(`dependency-cruiser-json-viewer is running at http://localhost:${port}${watchSuffix}`);
});
