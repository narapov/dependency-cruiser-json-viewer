/** @type {import('dependency-cruiser').IConfiguration} */
import { buildFolderImportRules } from './.dependency-cruiser/folder-import-rules.mjs';
import { buildLayerImportRules } from './.dependency-cruiser/layer-import-rules.mjs';

export default {
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
