import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  ...pluginQuery.configs['flat/recommended'],
  sonarjs.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      curly: ['error', 'all'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*Context.tsx', '**/*.context.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/index.ts', '**/index.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'VariableDeclaration',
          message: 'No variable declarations allowed in index files',
        },
        {
          selector: 'FunctionDeclaration',
          message: 'No function declarations allowed in index files',
        },
        {
          selector: 'ClassDeclaration',
          message: 'No class declarations allowed in index files',
        },
        {
          selector: 'TSInterfaceDeclaration',
          message: 'No interface declarations allowed in index files',
        },
        {
          selector: 'TSTypeAliasDeclaration',
          message: 'No type declarations allowed in index files',
        },
      ],
    },
  },
]);
