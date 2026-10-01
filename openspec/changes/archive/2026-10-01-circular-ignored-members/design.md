# Design

## Context

See proposal.md for motivation.

Today `buildFilteredCruiseSnapshot` filters modules via `filterCruiseResult`, then `buildCruiseSnapshot` calls `collectDistinctCycles(filteredModules)`. Remaining circular edges still carry full `dep.cycle` metadata, so partially ignored rings survive as path lists that include absent modules. `CircularPanel` then strips those paths against `getCruiseSources`, which invents a shorter label and drops all-ignored cycles. Rules and nodes stay correctly scoped to filtered modules; only cycles need an unfiltered source of truth.

## Goals / Non-Goals

**Goals:**

- Encode ignored membership on snapshot cycles so the UI does not re-derive it by filtering paths.
- Collect cycles from unfiltered `cruiseResult.modules`, annotate against filtered module sources, store on `snapshot.cycles`.
- Own that composition in domain (cruise result + ignore patterns → snapshot); delete App `buildFilteredCruiseSnapshot`.
- Present Without ignored / With ignored (partial) / Fully ignored sections (Rules-panel pattern).
- Clean up obsolete strip-filter logic and any helpers left unused after the shape change.

**Non-Goals:**

- Recomputing cycles from filtered edges (graph-honest rings).
- Showing ignored modules as graph nodes / ghost edges when Show cycle runs.
- Changing ignore pattern matching or `filterCruiseResult` edge stripping beyond what cycle collection needs.
- Persisting a new workspace setting for cycle section visibility.
- Rewriting every test to use the cruise-result entry — module-only `buildCruiseSnapshot` stays.

## Decisions

### 1. `DistinctCycle` uses structured members

```ts
interface DistinctCycleMember {
  path: string;
  ignored: boolean; // absent from filtered snapshot modules
}

interface DistinctCycle {
  members: DistinctCycleMember[];
}
```

**Why:** UI must not guess; one source of truth on the snapshot.  
**Alternatives:** Keep `paths: string[]` plus a parallel ignored set (easy to desync); leave filtering in the panel (status quo, misleading).

### 2. Domain owns result + ignore → snapshot; drop App glue

Add a domain entry (name flexible, e.g. `buildCruiseSnapshotFromResult(cruiseResult, ignorePatterns)`) that:

1. `filtered = filterCruiseResult(cruiseResult, ignorePatterns)`
2. `cycles = annotate(collectDistinctCycles(cruiseResult.modules), filteredModuleSources)`
3. Builds nodes / deps / rules from `filtered.modules` with those `cycles` attached

Keep existing `buildCruiseSnapshot(modules, ruleSet?, violations?)` for tests and module-only builds (all members `ignored: false` unless an optional present-sources / cycle-modules override is added later).

`workspaceStore` calls the domain entry; delete `App/stores/workspaceStore/helpers/buildFilteredCruiseSnapshot`. Where `applySettingsToCruiseResult` used `filteredCruiseResult.modules`, use `getCruiseModules(snapshot)` instead.

When ignore patterns are empty, annotation marks nothing ignored.

**Why:** Full-vs-filtered cycle semantics belong next to snapshot construction, not in a thin App wrapper that would only grow. All-ignored cycles disappear if collection runs only on filtered modules.  
**Alternatives:** Keep / expand `buildFilteredCruiseSnapshot` in App (rejected); inline filter+build at every store call site (duplication).

### 3. Panel sections = none / partial / fully ignored

- Without ignored: `every(m => !m.ignored)`
- With ignored: `some(m => m.ignored) && some(m => !m.ignored)` (partial only)
- Fully ignored: `every(m => m.ignored)`

Order: Without → With → Fully. Mirror `RulesList` / `RulesSection` structure rather than inventing new chrome.

**Why:** Fully ignored cycles always have Show cycle disabled and no graph presence; keeping them mixed with partial understates that difference.  
**Alternatives:** Two sections with any-ignored together (earlier default; superseded once Fully ignored was requested as its own block).

### 4. Show cycle stays present-only

Pass non-ignored paths into existing `showPathsOnly`. Disable the control when no present members remain. No temporary reintroduction of ignored modules into the graph.

**Why:** Agreed product trade-off — panel truthfulness matters more than a connected selection when edges were filtered away.

### 5. Cleanup after behavior lands

Remove `CircularPanel`'s `getCruiseSources` strip/map; migrate list item props to `members` (no dual `paths` adapter left behind); delete App `buildFilteredCruiseSnapshot` and its barrel; drop unused helpers introduced or orphaned by the split. Keep `getCruiseSources` / `filterCruiseResult` / module-only `buildCruiseSnapshot`.

## Risks / Trade-offs

- [Snapshot size] Full cruise may list many cycles that ignore patterns hide entirely → Mitigation: still one catalog; sectioning keeps the clean list scannable; no extra graph work.
- [Show cycle feels broken on partial ignore] Selection omits ignored hops so the graph may not look cyclic → Mitigation: accepted; label shows ignored members so the gap is explained.
- [API churn] Every `cycle.paths` consumer must move to `members` → Mitigation: few call sites (panel + tests + snapshot build); update in the same change.
- [Two build entry points] Result+ignore vs modules-only could drift → Mitigation: result entry filters then delegates to shared snapshot assembly (cycles annotated once in that path).

## Migration Plan

Internal-only type break; no persisted workspace schema change. Ship domain + panel + tests together. No rollback beyond reverting the change.

## Open Questions

None — explore decisions are locked for this change.
