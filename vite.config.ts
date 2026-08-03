import { execSync } from 'node:child_process';
import path from 'node:path';

import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';

import packageJson from './package.json' with { type: 'json' };
import { cruiseWatchPlugin } from './vite.cruiseWatchPlugin.ts';

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
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      ...(process.env.VITEST ? [] : [cruiseWatchPlugin(cruiseResultPath, { watchEnabled: cruiseWatchEnabled })]),
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
