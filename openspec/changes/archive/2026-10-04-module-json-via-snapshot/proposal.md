# Proposal

## Why

`useModuleJsonDialog` still resolves file/folder module JSON by scanning `cruiseResult.modules` and prefix-matching paths via `getModuleJsonData` / `collectSourcesUnderFolder` / `isUnderFolder`. That duplicates work already indexed in `CruiseSnapshot` (`nodes`, `originModule`, `descendantFiles`) and violates the project's snapshot-first path rules in `docs/architecture.md`.

## What Changes

- Resolve "view module JSON" from the loaded cruise snapshot node index (`originModule` / descendant file modules), not from a linear scan of `cruiseResult.modules` or path-prefix helpers.
- Remove the dead pathUtils path: `getModuleJsonData`, `collectSourcesUnderFolder`, and `isUnderFolder` (plus their tests and barrel exports) once nothing else depends on them.
- Keep the existing dialog UX: open for a known path with module data; do nothing when the path is unknown or has no modules.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `cruise-snapshot-path-topology`: Require that module JSON resolution for an indexed path uses snapshot node fields / cruise-snapshot helpers, not module-array scans or path-prefix membership.

## Impact

- `src/App/partials/JsonViewDialog/useModuleJsonDialog.tsx` and its store-backed dialog tests
- Domain removals under `src/domain/helpers/pathUtils/` (`getModuleJsonData`, `collectSourcesUnderFolder`, `isUnderFolder`)
- Reuse of existing snapshot helpers (`getCruiseSourcesUnder`, `getCruiseModules`) or direct `nodes` lookup — no new indexing required
