# Tasks

## 1. Snapshot-backed module JSON dialog

- [x] 1.1 Update `useModuleJsonDialog` to resolve the payload from `cruiseSnapshot` (`originModule` for files; descendant origin modules for folders via existing snapshot helpers or direct node fields) and verify the store-backed dialog test still opens for a known file path
- [x] 1.2 Extend dialog tests for unknown-path no-op (and folder open when a fixture can provide descendant modules) and verify those cases pass with `npm run test -- src/App/partials/JsonViewDialog`

## 2. Remove obsolete pathUtils helpers

- [x] 2.1 Delete `getModuleJsonData`, `collectSourcesUnderFolder`, and `isUnderFolder` (implementations, tests, and `pathUtils` barrel exports) and verify no remaining imports via repo search / TypeScript build
- [x] 2.2 Run `npm run lint`, `npm run format:check`, and `npm run test` for the touched areas and verify they pass
