# Design

## Context

See proposal.md — Why. Today `resolveNodeLayouts` already migrates legacy `nodePositions` → `nodeLayouts` inside `replaceWorkspaceSettings`, but `MergedViewerWorkspaceView`, the workspace store, `GraphLayoutState`, and save still carry both. Graph apply (`useApplyWorkspaceLayout`) and `setLayoutState` re-run the same migration as a fallback.

## Goals / Non-Goals

**Goals:**

- Single runtime representation: `nodeLayouts` / `SerializedLayoutCache`.
- Single migration site: workspace load/parse/replace.
- Save writes only `nodeLayouts` for custom layouts.

**Non-Goals:**

- Changing build/DnD layout-cache semantics.
- Removing Zod acceptance of inbound `nodePositions` (still needed to open old files).
- Schema version bump (optional later; not required for this cleanup).

## Decisions

### 1. Drop `nodePositions` from store and merged view

- **Choice:** `WorkspaceOwnState` and `MergedViewerWorkspaceView` keep only `nodeLayouts`. Load still parses deprecated `nodePositions` on `ViewerWorkspaceSettings`, then `resolveNodeLayouts` fills `nodeLayouts`; positions are not stored after that.
- **Why:** Avoids dual prune/normalize and a second source of truth.
- **Alternative:** Keep positions in store as a read-through cache — rejected; graph never needs them.

### 2. Graph API is layouts-only

- **Choice:** `GraphLayoutState` exposes `nodeLayouts` (plus autoLayoutOnly / edgesType). Remove `nodePositions` from get/set. `useApplyWorkspaceLayout` deserializes `nodeLayouts` only. Delete `layoutStateConverters` if nothing else imports them.
- **Why:** Matches the load contract; no remigration in UI.
- **Alternative:** Keep converters behind the handle for external callers — none exist beyond orchestration.

### 3. Save omits dual-write

- **Choice:** `getCurrentWorkspaceSettings` / serialize path set `nodePositions` to `{}` (or omit if schema allows) and persist `nodeLayouts` when not auto-layout-only.
- **Why:** User decision: only `nodeLayouts`. Zod can keep optional default `{}` so old readers that require the key still parse empty maps; new files do not carry meaningful positions.
- **Alternative:** Strip the key entirely from serialized JSON — nicer, but slightly more schema/serializer work; prefer `{}` if the settings object always includes the field today.

### 4. Domain helpers

- **Choice:** Keep `nodePositionsToNodeLayouts` next to the schema for inbound migrate. Stop using `nodeLayoutsToNodePositions` on the happy path (delete if unused after save/store cleanup). `replaceWorkspaceSettings` returns layouts only on the merged view.
- **Why:** Migration stays at the file boundary.

## Risks / Trade-offs

- [External tools that only read `nodePositions` from saved files] → Mitigation: intentional **BREAKING** write; document that layouts live under `nodeLayouts`. Inbound still works.
- [Tests assert dual fields on save / store] → Mitigation: update parse/store/orchestration/graph tests in the same change.
- [Missed call site still writing positions into store] → Mitigation: remove `setNodePositions` so TypeScript fails closed.

## Migration Plan

1. Domain merge + types: layouts-only view; settings still accept positions on parse.
2. Store + reconcile: drop positions fields/helpers; map from `nodeLayouts` only.
3. Graph + orchestration: layouts-only handle and apply; save `nodePositions: {}`.
4. Delete unused converters / prune-normalize-positions helpers; update tests.
5. Rollback: revert; old files with positions remain loadable via Zod + `resolveNodeLayouts`.
