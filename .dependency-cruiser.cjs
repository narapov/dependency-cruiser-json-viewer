/** @type {import('dependency-cruiser').IConfiguration} */
const { buildFolderImportRules } = require('./.dependency-cruiser/folder-import-rules.cjs');
const { buildLayerImportRules } = require('./.dependency-cruiser/layer-import-rules.cjs');

module.exports = {
  forbidden: [...buildLayerImportRules(), ...buildFolderImportRules()],
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
