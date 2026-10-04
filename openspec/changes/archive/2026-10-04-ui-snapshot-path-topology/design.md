# Design

## Context

See proposal.md — Why. Architecture already states the rule in `docs/architecture.md` (“Paths — prefer snapshot topology”). FileTree already uses `isPathVisibleInSelectionRecord` + `descendantFiles`. The remaining UI offenders are concentrated in `useAppOrchestration`, `useGraphWorkspaceActions`, HighlightEdgeDialog's `expandPathsWithAncestors`, plus `AppStatusBar` / `ApplicableRulesPanel` membership checks.

## Goals / Non-Goals

**Goals:**

- Inline snapshot lookups at UI call sites (`node.ancestors`, `node.parent`, `nodes.has`, `isPathVisibleInSelectionRecord`)
- Remove the dead string-prefix helper `isPathVisibleInSelection` after migration
- Keep UX behavior equivalent (same folders expanded, same membership outcomes for indexed paths)

**Non-Goals:**

- Shared `ancestorsForPaths` helper (one-liner; duplicate inline)
- Reworking store/settings pathUtils (`resolveActivePathAfterCollapse`, `isPathInSources` implementation, reconcile prune, groupMembership, `getModuleJsonData`, `buildRelationPathTree`)
- Changing presence-record store APIs or eliminating all array↔record conversions (MUI / workspace JSON boundaries stay)

## Decisions

### 1. Inline snapshot field reads

At each call site:

| Need                 | Read                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Ancestors to expand  | `cruiseSnapshot.nodes.get(path)?.ancestors ?? []`                                                 |
| Parent folder        | `cruiseSnapshot.nodes.get(path)?.parent ?? null`                                                  |
| Path still valid     | `cruiseSnapshot.nodes.has(path)`                                                                  |
| Selection visibility | `isPathVisibleInSelectionRecord(path, selectedFilePaths, nodes.get(path)?.descendantFiles ?? [])` |

**Alternatives considered:** extract `ancestorsForPaths` — rejected; too thin to justify a helper.

### 2. Missing nodes are no-ops for ancestor expansion

If a path is not in `nodes`, ancestor lists are empty (no `getAncestorKeys` fallback). Matches “node exists → use topology”; unindexed paths should not invent hierarchy from strings.

**Alternatives considered:** keep `?? getAncestorKeys(path)` in `expandPathsWithAncestors` — rejected; reintroduces the violation for the failure case.

### 3. Delete `isPathVisibleInSelection`

After `focusPath` migrates, the array + `startsWith` helper has no production callers. Remove module + tests; FileTree already uses the Record variant.

### 4. Leave `isPathInSources` in domain for now

UI stops calling it for membership. Store/settings may still use it until a later change. No API deletion in this change.

## Risks / Trade-offs

- **[Risk] Subtle membership difference vs `isPathInSources`** — `isPathInSources` treated folder ancestors of sources as valid even without an explicit folder node walk; snapshot `nodes` already indexes those folders at build time. Mitigation: rely on `buildCruiseSnapshot` folder nodes; existing FileTree already assumes `nodes.has` semantics.
- **[Risk] Duplicate activate/showRelated logic in two hooks drifts** — Acceptable; prefer identical inline replacements over a premature shared helper.
- **[Trade-off] Store-domain leftovers remain** — Scoped UI win now; follow-up change for store/settings topology cleanup.

## Migration Plan

1. Update UI call sites and tests that assert ancestor/parent/membership behavior.
2. Delete `isPathVisibleInSelection`.
3. No data migration; workspace persistence shape unchanged.
