/** @type {import('dependency-cruiser').IConfiguration} */
import { buildFolderImportRules } from './.dependency-cruiser/folder-import-rules.mjs';
import { buildLayerImportRules } from './.dependency-cruiser/layer-import-rules.mjs';

export default {
  forbidden: [
    ...buildLayerImportRules(),
    ...buildFolderImportRules(),
    {
      name: 'src-no-circular',
      severity: 'error',
      from: { path: '^src/' },
      to: { circular: true, dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'src-no-circular-type-only',
      severity: 'error',
      from: { path: '^src/' },
      to: { circular: true, dependencyTypes: ['type-only'] },
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
