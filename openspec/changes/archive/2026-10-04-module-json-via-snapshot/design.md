# Design

## Context

See proposal.md for motivation. Today `useModuleJsonDialog` reads `cruiseResult.modules` and calls `getModuleJsonData`, which linearly finds a module by `source` and otherwise uses `collectSourcesUnderFolder` / `isUnderFolder` prefix filtering. The loaded workspace already exposes `cruiseSnapshot` with `nodes.get(path)`, file `originModule`, and folder `descendantFiles`. Snapshot helpers `getCruiseSourcesUnder` and `getCruiseModules` already cover the same resolution without pathUtils.

## Goals / Non-Goals

**Goals:**

- Make module JSON open-path resolution snapshot-first and Map-lookup based.
- Delete the pathUtils helpers that exist only for this flow once unused.
- Preserve dialog open/no-op behavior for known vs unknown paths.

**Non-Goals:**

- Changing JsonViewDialog UI, titles, or how JSON is rendered.
- Adding new snapshot indexes or changing `CruisePathNode` shape.
- Broader pathUtils cleanup beyond helpers made dead by this change.
- The separate workspace expanded-folder record merge simplification.

## Decisions

1. **Resolve in the App hook from `cruiseSnapshot`, not via a new domain helper**
   - Rationale: `getCruiseSourcesUnder` + `getCruiseModules` (or direct `nodes` / `originModule` / `descendantFiles`) already express the behavior; a replacement `getModuleJsonData(snapshot, path)` would mostly re-wrap them.
   - Alternative considered: keep a thin domain helper taking `CruiseSnapshot` — rejected as unnecessary indirection for a single call site.

2. **Payload shape stays file → single module, folder → module array**
   - Rationale: matches current `getModuleJsonData` behavior and keeps the dialog payload familiar; easy to produce from `originModule` vs `getCruiseModules(..., descendantFiles)`.
   - Alternative considered: always pass an array — acceptable for the viewer, but unnecessary churn.

3. **Delete `getModuleJsonData`, `collectSourcesUnderFolder`, and `isUnderFolder` together**
   - Rationale: after the hook switch, `getModuleJsonData` is unused; `collectSourcesUnderFolder` is only used by it; `isUnderFolder` is only used by `collectSourcesUnderFolder` (plus its own tests). Removing all three avoids leaving a dead prefix-matching path in domain.
   - Alternative considered: leave `isUnderFolder` for potential future use — rejected; reintroduce if a real caller appears.

4. **Unknown / empty → no dialog (same as today)**
   - Missing snapshot node, missing `originModule`, or empty descendant module list → return without calling `openJsonDialog`.

## Risks / Trade-offs

- [Folder with zero resolvable origin modules] → Mitigation: treat like unknown and do not open; same practical outcome as today's empty filter.
- [Tests still assert against `cruiseResult.modules` wiring] → Mitigation: update `useCruiseResultJsonDialog.test.tsx` / related cases to exercise snapshot-backed open behavior (file open, unknown path no-op; folder case if fixtures allow).

## Migration Plan

Pure in-app refactor. No persisted data format changes. Roll forward by switching the hook and deleting unused helpers; roll back by restoring those files if needed.
