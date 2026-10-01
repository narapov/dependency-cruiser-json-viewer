# Design

## Context

See proposal.md — Why. QuickPick already walks `CruiseSnapshot.tree` in `buildSearchItems` and exposes search helpers via the feature barrel for `PathSearchDialog`. `CruisePathNode` already has `parent` and `ancestors` (nearest parent → root). Architecture forbids `getParentPath` / ad-hoc path parsing when the node is in the snapshot.

Out of scope for this design: moving the searchable list into `CruiseSnapshot`, changing fuzzy ranking libraries, or rewriting `computeQuickPickHighlight` (still uses `lastSlash` to map highlight indexes; optional follow-up).

## Goals / Non-Goals

**Goals:**

- Carry `parent` on `QuickPickFileItem` from `node.parent` at build time.
- Classify tiers from topology (`path` + `ancestors`), preserving current tier semantics for existing tests (root and nested `src`/`lib`/`node_modules`).
- Drop `getParentPath` from the file results list item; use `item.parent`.
- Keep PathSearchDialog working via the same item type and helpers.

**Non-Goals:**

- Precomputing search items on the snapshot.
- Changing fuzzysort keys, limits, or multipliers (except how tier is obtained).
- Refactoring `computeQuickPickHighlight` to take parent explicitly (unless needed for type/compile fallout).
- AGENTS hook-signature / `useMemo` cleanups.

## Decisions

### 1. Store `parent` on the item; do not look up the snapshot in the list row

**Choice:** `QuickPickFileItem.parent: string | null` set in `buildSearchItems` from `node.parent`.

**Why:** List rows and PathSearchDialog already receive plain items; looking up `cruiseSnapshot.nodes` in every row would reintroduce store coupling. Parent is stable for the snapshot lifetime.

**Alternative:** Pass snapshot into the list item and read `nodes.get(key)?.parent` — rejected (extra coupling, hot-path map lookup).

### 2. Tier from ancestors at classify time (or store tier on the item)

**Choice:** Change `getPathSearchTier` to accept topology (`path` + `ancestors`, or the whole item once enriched). Prefer detecting a folder segment `S` when `path === S` or some ancestor `a === S` or `a.endsWith('/' + S)`. Optionally store `tier` on the item at build time so `searchPaths` never touches ancestors.

**Preferred implementation:** Enrich items with `parent` (required) and compute tier inside `getPathSearchTier` from `key` + `ancestors` carried on the item **or** from a `tier` field set at build. Carrying `ancestors` only for tier is heavier; storing numeric `tier` at build is smaller and keeps `searchPaths` dumb.

**Decision:** Store `tier` on `QuickPickFileItem` at `buildSearchItems` time (computed once from `node.path` + `node.ancestors`). `searchPaths` reads `item.tier`. Export tier helpers as needed for tests.

**Alternative:** Keep classifying from `key` string via `split` — rejected (proposal goal).

**Alternative:** Keep `ancestors` array on every item — works but duplicates snapshot data for every search hit; unnecessary if only tier is needed at search time.

### 3. Keep `getBaseName` at build time

**Choice:** Continue using `getBaseName(node.path)` when creating `name`. Nodes have no separate name field; one-time build is acceptable under architecture (pathUtils for building indexes / derived lists).

### 4. Highlight helper unchanged for now

**Choice:** Leave `computeQuickPickHighlight(query, name, key)` as-is. Indexes into the key prefix remain valid for `item.parent` because parent is the key prefix before the final slash.

**Follow-up (non-goal):** Match against `parent` directly and drop `lastSlash` logic.

## Risks / Trade-offs

- **[Risk] Tier semantic drift for odd paths** → Mitigation: keep existing `getPathSearchTier` / `searchPaths` tests; add cases that assert ancestor-based detection equals prior `split` behavior for fixtures already covered (`packages/app/src/…`, `node_modules`, etc.).
- **[Risk] Test factories omit new fields** → Mitigation: update `searchItem` helpers and any PathSearchDialog tests that construct `QuickPickFileItem` manually.
- **[Trade-off] `tier` on item vs live ancestors** → `tier` is a denormalized cache of topology; rebuild whenever snapshot rebuilds (same as today's `buildSearchItems` memo). Acceptable.

## Migration Plan

- Pure client change; no persisted data format.
- Deploy with the app; rollback is revert.

## Open Questions

None — highlight refactor deferred; snapshot-level search index deferred.
