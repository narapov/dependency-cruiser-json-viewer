# Tasks

## 1. Search item shape and build

- [x] 1.1 Add `parent: string | null` and `tier` (PathSearchTier) to `QuickPickFileItem` and verify TypeScript compiles for the type module
- [x] 1.2 Update `buildSearchItems` to set `parent` from `node.parent` and `tier` from topology (`node.path` + `node.ancestors`); verify `buildSearchItems` tests assert parent on nested and root items

## 2. Tier classification and search

- [x] 2.1 Rewrite `getPathSearchTier` to classify from path + ancestors (or only expose tier via item); remove leaf `split('/')` segment scan; verify existing tier unit tests pass with updated call shape
- [x] 2.2 Update `searchPaths` to use `item.tier` for score multipliers; verify ranking test (`src` > `lib` > other > `node_modules`) still passes with factories that set `parent`/`tier`

## 3. File result UI

- [x] 3.1 Replace `getParentPath(item.key)` in `QuickPickFileResultsListItem` with `item.parent`; verify file-result / QuickPick tests still pass and no `getParentPath` import remains under QuickPick UI

## 4. Call-site and verification

- [x] 4.1 Fix any PathSearchDialog or manual `QuickPickFileItem` factories for the new fields; verify related unit tests pass
- [x] 4.2 Run `npm run test` (QuickPick + PathSearchDialog suites) and `npm run lint`; verify both succeed
