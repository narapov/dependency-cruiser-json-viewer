#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import handler from 'serve-handler';

const DEFAULT_PORT = 7347;
const DEFAULT_HOST = '127.0.0.1';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: { type: 'string', short: 'p' },
    host: { type: 'string', short: 'h' },
    help: { type: 'boolean' },
  },
  allowPositionals: true,
});

function printUsage() {
  console.error(
    `Usage: dependency-cruiser-json-viewer <path-to-cruise-result.json> [--port <number>] [--host <host>]

Options:
  --port, -p  HTTP port (default: ${DEFAULT_PORT})
  --host, -h  Bind host (default: ${DEFAULT_HOST})
`,
  );
}

if (values.help || positionals.length === 0) {
  printUsage();
  process.exit(values.help ? 0 : 1);
}

const cruiseJsonPath = path.resolve(positionals[0]);

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

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: port ${port} is already in use`);
  } else {
    console.error(`Error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`dependency-cruiser-json-viewer is running at http://localhost:${port}`);
});
