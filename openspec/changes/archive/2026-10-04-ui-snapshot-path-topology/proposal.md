# Proposal

## Why

After a cruise result loads, hierarchy already lives on `CruisePathNode` (`ancestors`, `parent`, `descendantFiles`, `nodes`). Several UI workspace actions still rediscover that hierarchy by parsing path strings (`getAncestorKeys`, `getParentPath`, `startsWith`, `isPathInSources`), which violates the project's snapshot-topology rule and forces unnecessary array↔record round-trips (e.g. `focusPath` via `isPathVisibleInSelection`).

## What Changes

- UI orchestration and graph workspace actions resolve ancestors, parent, path membership, and selection visibility from the cruise snapshot index.
- Remove the string-prefix helper `isPathVisibleInSelection` once call sites use `isPathVisibleInSelectionRecord`.
- Drop the `getAncestorKeys` fallback in HighlightEdgeDialog's `expandPathsWithAncestors`.
- Status bar and applicable-rules panel resolve active/panel paths with `cruiseSnapshot.nodes.has` instead of `isPathInSources`.

## Capabilities

### New Capabilities

- `cruise-snapshot-path-topology`: After load, path hierarchy and membership used by UI workspace flows MUST come from cruise snapshot node fields, not from reparsing path strings.

### Modified Capabilities

- (none)

## Impact

- `useAppOrchestration`, `useGraphWorkspaceActions`, `expandPathsWithAncestors`, `AppStatusBar`, `ApplicableRulesPanel`
- Domain: delete `isPathVisibleInSelection` (+ tests); keep `isPathVisibleInSelectionRecord`
- Out of scope: store/settings helpers still on pathUtils (`resolveActivePathAfterCollapse`, `isPathInSources` implementation, reconcile prune, groupMembership, `getModuleJsonData`, `buildRelationPathTree`); no new shared `ancestorsForPaths` helper
