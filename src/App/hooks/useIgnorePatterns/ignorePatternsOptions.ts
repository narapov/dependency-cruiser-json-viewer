import { appStorageKey } from '@/Shared';

export const IGNORE_PATTERNS_STORAGE_KEY = appStorageKey('ignore-patterns');

export const GLOB_PATTERNS_DOCS_URL = 'https://github.com/micromatch/picomatch#globbing-features';

export const IGNORE_PATTERN_EXAMPLES = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.stories.tsx',
  '**/__tests__/**',
  '**/__fixtures__/**',
] as const;
