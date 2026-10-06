# Tasks

## 1. Path utils for `node:` namespace (v1 — done, superseded by §5)

- [x] 1.1 Add `isNodeBuiltinPath` (and optional `NODE_BUILTIN_ROOT` / `toNodeBuiltinSnapshotPath` helpers) under `src/domain/helpers/pathUtils/`; export from the pathUtils barrel; verify unit tests cover `node:`, `node:/crypto`, `node:/path/posix`, and non-matching paths
- [x] 1.2 Update `getParentPath`, `getAncestorKeys`, and `getBaseName` for the flat `node:` rules in design.md; verify unit tests assert parent/ancestors/basename for `node:/crypto` and `node:/path/posix`, and that normal project paths are unchanged

## 2. Snapshot rewrite of core modules (v1 — done, superseded by §5)

- [x] 2.1 Apply `coreModule` → `node:/<source>` rewrite when building module dependency indexes (`buildModulesDependencies`) for both edge source and `resolved` target; verify tests cover a local→core edge landing on `node:/fs` (and indexed under `node:`)
- [x] 2.2 Apply the same rewrite when placing modules in `buildCruiseSnapshot` / `createTree` so file node keys are rewritten while `originModule` stays the original cruise module; verify tests that a core module becomes a child of `node:` and is absent as a bare top-level root
- [x] 2.3 Add snapshot tests for nested cores `path` + `path/posix` as sibling file nodes under `node:` with no folder at `node:/path`, and basename/title `path/posix`; verify those tests pass
- [x] 2.4 Ensure cycles (and violations if they reference core endpoints) use rewritten paths consistent with the tree; verify existing snapshot cycle/rules tests still pass and add a focused case if a core path appears in cycles

## 3. Default selection (v1 — done, superseded by §5)

- [x] 3.1 Exclude `node:` file paths from `getDefaultSelectedKeys` (same policy as `node_modules`); verify unit tests for mixed `src` + `node:/crypto` + `node_modules/...` selection

## 4. Verification (v1 — done)

- [x] 4.1 Run `npm run lint`, `npm run format:check`, and `npm run test` and verify all three succeed

## 5. `:buildIn:` root and protocol-prefixed flat leaves

- [x] 5.1 Replace v1 `node:` path utils with `:buildIn:` helpers: root `:buildIn:`, leaf = `protocol ? protocol+id : id`, path = `:buildIn:/` + leaf, flat parent/basename under the root; verify unit tests for `:buildIn:/crypto`, `:buildIn:/node:path/posix`, `:buildIn:/bun:fs`, and unchanged project paths
- [x] 5.2 In `buildModulesDependencies`, rewrite core endpoints with the leaf formula (no default protocol); verify unset → `:buildIn:/fs`, `node:` → `:buildIn:/node:fs`, `bun:` → `:buildIn:/bun:fs`
- [x] 5.3 In snapshot tree placement, emit one file leaf per distinct inbound leaf name for each core module (orphan → bare source leaf), sharing `originModule`; verify mixed unset+`node:` yields both `:buildIn:/fs` and `:buildIn:/node:fs`, and `:buildIn:/node:path/posix` has parent `:buildIn:` with basename `node:path/posix`
- [x] 5.4 Point default selection at `:buildIn:` (drop `node:`-only exclusion); verify `:buildIn:/node:fs` omitted and `src/…` kept
- [x] 5.5 Adjust cycle member rewrite to `:buildIn:/` + bare id (stable fallback if only prefixed leaves exist); verify existing cycle tests still pass
- [x] 5.6 Update or remove obsolete v1 `node:/…` unit expectations; run `npm run lint`, `npm run format:check`, and `npm run test` and verify all three succeed
