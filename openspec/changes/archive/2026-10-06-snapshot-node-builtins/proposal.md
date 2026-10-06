# Proposal

## Why

Core modules (`crypto`, `fs`, `path/posix`, …) appear in cruise results as bare `module.source` / `dep.resolved` values with `coreModule: true`. Snapshot build must park them away from project top-level roots. Inventing a default `node:` protocol is dishonest when cruise left `protocol` unset, and separate per-protocol roots (`node:`, `bun:` at tree root) over-structure what is really a bag of core ids (sometimes with an explicit protocol prefix in the name).

## What Changes

- Place every core-module endpoint under a single synthetic root folder `:buildIn:`.
- Leaf name (one flat segment under that root): if the dependency has `protocol`, use `protocol + cruiseId` (e.g. `node:` + `path/posix` → leaf `node:path/posix`); if `protocol` is unset, use the bare cruise id (`fs`, `crypto`). Full snapshot path: `:buildIn:/` + leaf (e.g. `:buildIn:/node:path/posix`).
- Do **not** default missing protocol to `node:`.
- Under `:buildIn:`, do not create folder hierarchy from `/` inside the leaf name (`node:path/posix` is one module title/parent is always `:buildIn:`).
- When the same cruise id appears both with and without protocol (or with different protocols), emit distinct leaves (e.g. `:buildIn:/fs` and `:buildIn:/node:fs`).
- Default file selection excludes everything under `:buildIn:`, same policy as `node_modules`.
- Path helpers treat the `:buildIn:` namespace as a flat synthetic root.

## Capabilities

### New Capabilities

- `cruise-snapshot-node-builtins`: Snapshot placement of core modules under synthetic `:buildIn:`, protocol-prefixed flat leaf names when protocol is set, and default-selection exclusion of that root.

### Modified Capabilities

- (none)

## Impact

- Domain: `buildCruiseSnapshot` / `buildModulesDependencies`; `pathUtils` (synthetic `:buildIn:` helpers); `getDefaultSelectedKeys`.
- App/UI: FileTree titles/roots follow snapshot topology via `getBaseName` / tree keys.
- User-facing: core modules appear under `:buildIn:`; unchecked by default; still selectable manually.
- Out of scope: grouping unresolved non-core roots; QuickPick search-tier ranking for `:buildIn:`; mutating `originModule.source`; ignore-pattern presets.
