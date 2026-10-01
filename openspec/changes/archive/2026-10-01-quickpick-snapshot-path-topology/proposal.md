# Proposal

## Why

QuickPick path search rebuilds parent paths and ranking tiers by reparsing path strings (`getParentPath`, `split('/')`) even though every item comes from a `CruisePathNode` that already exposes `parent` and `ancestors`. That violates the project's snapshot-topology rule and makes PathSearchDialog reuse the same fragile derivation.

## What Changes

- Enrich `QuickPickFileItem` with `parent` taken from `CruisePathNode.parent` when building search items.
- Classify path search tiers from snapshot topology (`ancestors` / path equality), not by splitting the leaf key on every search.
- File result rows read `item.parent` instead of calling `getParentPath`.
- Update QuickPick path-search helpers/tests for the new item shape and tier input; keep ranking semantics equivalent for current fixtures (incl. monorepo `…/src/…` and `…/lib/…`).

## Capabilities

### New Capabilities

- `quickpick-path-search`: Building, ranking, and displaying QuickPick (and PathSearchDialog) file/folder search items from cruise snapshot topology without reparsing loaded paths for parent or tier.

### Modified Capabilities

- (none)

## Impact

- `src/App/partials/QuickPick/` — types, `buildSearchItems`, `getPathSearchTier` / `searchPaths`, file results list item, related tests.
- `src/App/partials/PathSearchDialog/` — consumes `QuickPickFileItem` / helpers via QuickPick barrel; may need type updates only.
- No cruise snapshot schema change; no new dependencies.
