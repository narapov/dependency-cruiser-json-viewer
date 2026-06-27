import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const sharedImportRestrictions = {
  patterns: [
    {
      group: ['**/Shared/components', '**/Shared/components/*'],
      message: 'Import from the Shared root barrel only: from "../../Shared"',
    },
    {
      group: ['**/Shared/helpers', '**/Shared/helpers/*'],
      message: 'Import from the Shared root barrel only: from "../../Shared"',
    },
    {
      group: ['**/Shared/hooks', '**/Shared/hooks/*'],
      message: 'Import from the Shared root barrel only: from "../../Shared"',
    },
    {
      group: ['**/App/helpers', '**/App/helpers/*'],
      message: 'App helpers are private to App/',
    },
    {
      group: ['../**/partials/*', '../../**/partials/*', '../../../**/partials/*'],
      message: 'Import feature modules through their public index.ts barrel',
    },
    {
      group: ['../**/helpers/*', '../../**/helpers/*', '../../../**/helpers/*'],
      message: 'Import feature modules through their public index.ts barrel',
    },
    {
      group: ['../**/types/*', '../../**/types/*', '../../../**/types/*'],
      message: 'Import types through ComponentName.types.ts or the module public index.ts',
    },
  ],
}

export default defineConfig([
  globalIgnores(['dist']),
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
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/Shared/**'],
    rules: {
      'no-restricted-imports': ['error', sharedImportRestrictions],
    },
  },
])
