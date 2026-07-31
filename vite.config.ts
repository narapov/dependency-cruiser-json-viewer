import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'vitest/config';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';

import packageJson from './package.json' with { type: 'json' };

const cruiseResultPath = path.resolve('test-data/cruise-result.json');

function getGitCommitHash(): string {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __PACKAGE_NAME__: JSON.stringify(packageJson.name),
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: 'dev-cruise-result',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0];
          if (url !== '/cruise-result.json') {
            next();
            return;
          }
          if (!fs.existsSync(cruiseResultPath)) {
            res.statusCode = 404;
            res.end('Run: npm run depcruise:json-for-cli');
            return;
          }
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          fs.createReadStream(cruiseResultPath).pipe(res);
        });
      },
    },
  ],
  test: {
    environment: 'node',
  },
});
