import { type Config } from 'prettier';

import sortImports from '@ianvs/prettier-plugin-sort-imports';

const config: Config = {
  arrowParens: 'avoid',
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 120,

  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.mts', '*.mjs', '*.cjs'],
      options: {
        plugins: [sortImports],
        importOrder: [
          '<BUILTIN_MODULES>',
          '',
          '<THIRD_PARTY_MODULES>',
          '',
          '(?!^@/)^@(.*)$',
          '',
          '^@/(.*)$',
          '',
          '^(?!.*\\.s?css$)[./].*$',
          '',
          '\\.s?css$',
        ],
        importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
        importOrderTypeScriptVersion: '6.0.0',
        importOrderCaseSensitive: false,
      },
    },
    {
      files: ['*.scss', '*.css'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
      },
    },
  ],
};

export default config;
