# Proposal

## Why

When ignore patterns hide a member of a circular dependency, the Circular panel silently strips that path from the cycle label (e.g. `a → b → c → d` becomes `a → c → d`). That implies a cycle that does not exist in the filtered graph and misleads users about the real dependency ring.

## What Changes

- Snapshot cycles carry per-member presence: each cycle member includes whether it is among the filtered snapshot modules (`ignored` when absent, typically due to ignore patterns).
- **BREAKING** (internal type): `DistinctCycle.paths: string[]` becomes structured members (e.g. `{ path, ignored }[]`).
- Cycles on the snapshot are collected from the **unfiltered** cruise result modules, then annotated against filtered module sources, so partially and fully ignored cycles remain visible.
- Circular panel keeps the full cycle order, marks ignored members in labels/lists, and groups cycles into three sections: Without ignored / With ignored (partial) / Fully ignored, mirroring the Rules panel section pattern.
- "Show cycle" still selects only non-ignored members; when every member is ignored, the action is disabled.
- Remove obsolete Circular-panel path stripping against `getCruiseSources` and any leftover helpers that only existed to support that filter.
- Delete App `buildFilteredCruiseSnapshot`; ignore filtering + cycle annotation composition moves into domain (keep `buildCruiseSnapshot(modules, …)` for tests / module-only builds).

## Capabilities

### New Capabilities

- `cruise-snapshot-cycles`: Snapshot cycle catalog with ignored-member annotation, and Circular panel presentation (full cycle truthfulness, sections, show-cycle behavior).

### Modified Capabilities

- (none)

## Impact

- Domain: `DistinctCycle`, `collectDistinctCycles` (and/or annotate helper), `buildCruiseSnapshot`, new (or extended) entry that builds a snapshot from a cruise result + ignore patterns.
- App: remove `buildFilteredCruiseSnapshot`; `workspaceStore` calls the domain entry; `CircularPanel` / list / i18n for sections and ignored markers; `getCruiseModules(snapshot)` where filtered modules were taken from the old helper return value.
- Tests: cycle collection, result+ignore snapshot wiring, Circular panel section/label behavior; rewrite the current "hide all-outside cycles" expectation.
- Orchestration `showPathsOnly` stays as-is; the panel passes only present paths (or disables the action).
