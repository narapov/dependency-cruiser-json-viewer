import type { Config } from 'release-it';

export default {
  git: {
    commitMessage: 'chore: release v${version}',
    requireBranch: 'main',
    requireCleanWorkingDir: true,
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: 'v${version}',
  },
  npm: {
    publish: true,
    skipChecks: true,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'conventionalcommits',
      infile: 'CHANGELOG.md',
    },
  },
  hooks: {
    'before:init': ['npm run lint', 'npm run format:check', 'npm run test', 'npm run depcruise', 'npm run build'],
  },
} satisfies Config;
