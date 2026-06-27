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
}
