# Proposal

## Why

After introducing `nodeLayouts` (group cache with sizes), the app still dual-tracks legacy `nodePositions` through the workspace store, graph handle, and save path. Migration already belongs at the workspace load boundary (`resolveNodeLayouts`); repeating it in the graph adds noise and keeps a second source of truth. Persist and runtime state should be `nodeLayouts` only.

## What Changes

- **BREAKING** (workspace file write): saved workspace settings write only `nodeLayouts` for custom layouts; stop dual-writing `nodePositions` on save (field may be omitted or empty).
- Keep **inbound** acceptance of legacy position-only workspaces: migrate once at load/parse/replace into `nodeLayouts`.
- Remove `nodePositions` from workspace store own state, graph layout apply path, and `GraphLayoutState` / imperative get/set.
- Delete graph-side `legacyPositionsToLayouts` / `layoutsToLegacyPositions` usage (and helpers if unused).
- Domain merge/view types and reconcile prune paths stop carrying parallel position maps once layouts are the sole runtime representation.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `graph-layout-cache`: Clarify that legacy `nodePositions` are accepted only at workspace load (migrated into the layout cache shape); runtime restore and save use `nodeLayouts` only—no dual persist or graph-layer remigration.

## Impact

- Domain: `ViewerWorkspaceSettings` / `MergedViewerWorkspaceView`, `replaceWorkspaceSettings`, schema helpers, serialize/save path.
- App store: `WorkspaceOwnState`, `setNodePositions`, `normalizeNodePositions` / `pruneNodePositions`, reconcile/map helpers, store tests.
- Graph: `GraphCanvas`, `useApplyWorkspaceLayout`, `useDependencyGraphImperativeRef`, `DependencyGraphHandle` / `GraphLayoutState`, `layoutStateConverters`.
- Orchestration: `getCurrentWorkspaceSettings` / layout bridge in `useAppOrchestration`.
- Tests for workspace parse, store, graph layout apply, and save payloads.
