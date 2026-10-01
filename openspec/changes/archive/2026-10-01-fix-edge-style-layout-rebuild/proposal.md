# Proposal

## Why

Changing graph edge style (`edgesType`) re-runs the layout-restore effect because `layoutApplyKey` includes it. That resets the live layout cache from persisted workspace layouts and triggers a full graph rebuild, discarding unsaved drag positions. Edge style is a render-only concern: `DependencyEdge` already reads `edgesType` from the store and recomputes paths without a rebuild.

## What Changes

- Stop treating `edgesType` as a layout-apply / rebuild trigger in `DependencyGraph`.
- Keep layout restore + rebuild keyed only on inputs that actually change layout semantics (`autoLayoutOnly`, persisted `nodeLayouts` / `nodePositions`).
- Document in `graph-layout-cache` that edge-style changes must not rebuild or reapply the layout cache.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `graph-layout-cache`: Require that changing graph edge style does not rebuild the graph or reset the live layout cache from persisted layouts.

## Impact

- `src/App/partials/DependencyGraph/DependencyGraph.tsx` (`layoutApplyKey` and related effect).
- No workspace schema, API, or dependency changes.
- Unsaved drag layouts and edge-style switching become independent; edge paths continue to update via `DependencyEdge` store subscription.
