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
    help: { type: 'boolean' },
  },
  allowPositionals: true,
});

function printUsage() {
  console.error(
    `Usage: dependency-cruiser-json-viewer <path-to-cruise-result.json> [--port <number>] [--host <host>] [--watch]

Options:
  --port, -p   HTTP port (default: ${DEFAULT_PORT})
  --host, -h   Bind host (default: ${DEFAULT_HOST})
  --watch, -w  Watch cruise JSON and notify the UI to reload
`,
  );
}

if (values.help || positionals.length === 0) {
  printUsage();
  process.exit(values.help ? 0 : 1);
}

const cruiseJsonPath = path.resolve(positionals[0]);
const watchMode = values.watch === true;

if (!fs.existsSync(cruiseJsonPath)) {
  console.error(`Error: file not found: ${cruiseJsonPath}`);
  process.exit(1);
}

const stat = fs.statSync(cruiseJsonPath);
if (!stat.isFile()) {
  console.error(`Error: not a file: ${cruiseJsonPath}`);
  process.exit(1);
}

if (!cruiseJsonPath.endsWith('.json')) {
  console.error(`Error: expected a .json file: ${cruiseJsonPath}`);
  process.exit(1);
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
    res.end(`window.envs = { watch: ${watchMode} };\n`);
    return;
  }

  if (pathname === '/cruise-result.json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    fs.createReadStream(cruiseJsonPath).pipe(res);
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
