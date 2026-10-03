import { execSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { loadEnv, type Plugin, type ResolvedConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';

import packageJson from './package.json' with { type: 'json' };
import { cruiseWatchPlugin } from './vite.cruiseWatchPlugin.ts';

const cruiseResultPath = path.resolve('test-data/cruise-result.json');
const libavoidWasmPath = path.resolve('node_modules/@mr_mint/elkjs-libavoid/dist/libavoid.wasm');

/** Serves and copies libavoid.wasm next to the Vite app output (no postinstall). */
function libavoidWasmPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    name: 'libavoid-wasm',
    configResolved(config) {
      resolvedConfig = config;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestPath = request.url?.split('?')[0] ?? '';
        if (!requestPath.endsWith('/libavoid.wasm') && requestPath !== '/libavoid.wasm') {
          next();
          return;
        }

        response.setHeader('Content-Type', 'application/wasm');
        createReadStream(libavoidWasmPath).pipe(response);
      });
    },
    async writeBundle() {
      const outputDirectory = path.resolve(resolvedConfig.root, resolvedConfig.build.outDir);
      await mkdir(outputDirectory, { recursive: true });
      await copyFile(libavoidWasmPath, path.join(outputDirectory, 'libavoid.wasm'));
    },
  };
}

function getGitCommitHash(): string {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cruiseWatchEnabled = (process.env.CRUISE_WATCH ?? env.CRUISE_WATCH) === 'true';

  return {
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
      react({ exclude: /\.worker\.[tj]sx?$/ }),
      babel({
        exclude: /\.worker\.[tj]sx?$/,
        presets: [reactCompilerPreset()],
      }),
      // Skip Vite-only middleware/copy during Vitest — avoids hanging the test server deps graph.
      ...(process.env.VITEST
        ? []
        : [libavoidWasmPlugin(), cruiseWatchPlugin(cruiseResultPath, { watchEnabled: cruiseWatchEnabled })]),
    ],
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./src/setupTests.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}', '.dependency-cruiser/**/*.test.ts'],
      coverage: {
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/**/index.{ts,tsx}', 'src/i18n/locales/**', 'src/testsUtils/**'],
      },
    },
  };
});
