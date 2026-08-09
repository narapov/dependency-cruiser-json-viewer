/** @type {import('dependency-cruiser').IConfiguration} */
import baseConfig from './.dependency-cruiser.mjs';

const EXTERNAL_DEP_TYPES = ['npm', 'npm-dev', 'core'];

export default {
  ...baseConfig,
  forbidden: [
    ...baseConfig.forbidden,
    {
      name: 'samples-no-circular',
      severity: 'error',
      from: { path: '^invalid_samples/' },
      to: { circular: true, dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'samples-no-circular-type-only',
      severity: 'error',
      from: { path: '^invalid_samples/' },
      to: { circular: true, dependencyTypes: ['type-only'] },
    },
    {
      name: 'samples-domain-only-domain',
      severity: 'error',
      from: { path: '^invalid_samples/domain/' },
      to: { pathNot: '^invalid_samples/domain/', dependencyTypesNot: EXTERNAL_DEP_TYPES },
    },
    {
      name: 'samples-shared-only-shared-and-domain',
      severity: 'error',
      from: { path: '^invalid_samples/Shared/' },
      to: {
        pathNot: ['^invalid_samples/Shared/', '^invalid_samples/domain/'],
        dependencyTypesNot: EXTERNAL_DEP_TYPES,
      },
    },
    {
      name: 'samples-app-root-only-partial-barrels',
      severity: 'error',
      from: { path: '^invalid_samples/App/', pathNot: '^invalid_samples/App/partials/' },
      to: {
        path: '^invalid_samples/App/partials/[^/]+/(?!index\\.ts$).+',
        dependencyTypesNot: EXTERNAL_DEP_TYPES,
      },
    },
    {
      name: 'samples-no-peer-cross-import',
      severity: 'warn',
      from: { path: '^invalid_samples/warnPeers/([^/]+)/' },
      to: {
        path: '^invalid_samples/warnPeers/',
        pathNot: '^invalid_samples/warnPeers/$1/',
        dependencyTypesNot: EXTERNAL_DEP_TYPES,
      },
    },
    {
      name: 'samples-no-legacy-imports',
      severity: 'warn',
      from: { path: '^invalid_samples/warnLegacy/modern/' },
      to: {
        path: '^invalid_samples/warnLegacy/legacy/',
        dependencyTypesNot: EXTERNAL_DEP_TYPES,
      },
    },
    {
      name: 'samples-no-orphans',
      severity: 'warn',
      from: { orphan: true, path: '^invalid_samples/warnOrphan/' },
      to: {},
    },
  ],
};
