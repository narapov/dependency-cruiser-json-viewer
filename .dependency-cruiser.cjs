/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-app-from-components',
      severity: 'error',
      from: { path: '^src/components/' },
      to: { path: '^src/App/' },
    },
    {
      name: 'no-shared-from-app-or-components',
      severity: 'error',
      from: { path: '^src/Shared/' },
      to: { path: '^src/(App|components)/' },
    },
    {
      name: 'no-domain-from-upper-layers',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/(App|components)/' },
    },
    {
      name: 'no-shared-from-domain',
      severity: 'error',
      from: { path: '^src/Shared/' },
      to: { path: '^src/domain/' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.app.json',
    },
  },
};
