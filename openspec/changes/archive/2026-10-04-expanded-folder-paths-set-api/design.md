# Design

## Context

See proposal.md — Why. Today the store exposes:

- `setExpandedFolderPaths(record)` — blind replace of the record, no `activePath` handling
- `replaceExpandedFolderPaths(paths[])` — array in, rebuilds record, diffs previous path list for collapses, then fixes `activePath`

Call sites almost always convert `presenceRecordToPaths` → mutate arrays → call `replaceExpandedFolderPaths`, even for soft expand/collapse patches. Soft-walk domain helpers already return path lists; the waste is rebuilding the full set instead of patching the record.

`resolveActivePathAfterCollapse(activePath, collapsedFolders[])` stays in domain; only how collapsed folders are detected changes.

## Goals / Non-Goals

**Goals:**

- Single store action: `setExpandedFolderPaths(next, options?: { replace?: boolean })`
- Default merge; `replace: true` for full snapshots
- Collapse detection from pre/post presence (`true` → falsy), including keys dropped under replace
- Migrate all production callers off the array replace API

**Non-Goals:**

- Changing soft-walk algorithms or `folder-expansion` UX surfaces
- Refactoring `selectedFilePaths` to the same options shape
- Compacting/`delete` of falsy keys (keeping `false`/`undefined` in the record is fine)
- New active-element menu items

## Decisions

### 1. One method with optional `replace`

```ts
setExpandedFolderPaths(
  next: Record<string, boolean | undefined>,
  options?: { replace?: boolean },
): void
```

- `options?.replace !== true` → `result = { ...current, ...next }`
- `options?.replace === true` → `result = next` (no merge)

**Alternatives considered:** separate `expandFolderPaths` / `collapseFolderPaths` — clearer at call sites but two entrypoints plus still needing replace for MUI. Rejected in favor of one method per product decision.

### 2. Presence: only `true` is present

Lookup and collapse detection use truthiness of `true` only. `false` and `undefined` are both absent. Input type stays `Record<string, boolean | undefined>` so patches may use either.

`presenceRecordToPaths` already filters with `present` truthiness; no semantic change required there. `pathsToPresenceRecord` remains a boundary helper for array→all-`true` records (MUI, settings sync).

### 3. Collapse detection without array round-trip

```
previous = get().expandedFolderPaths
result = replace ? next : { ...previous, ...next }
collapsed = keys where previous[k] === true && !result[k]
  (for replace: also keys that were true in previous and missing from result)
if collapsed.length → activePath = resolveActivePathAfterCollapse(...)
set({ expandedFolderPaths: result, activePath? })
```

Under merge, collapsed keys are exactly those set to falsy in `next` that were previously `true`. Under replace, compare full previous vs result.

### 4. Caller migration patterns

| Before          | After                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| expand paths    | `setExpandedFolderPaths(Object.fromEntries(paths.map(p => [p, true])))`  |
| collapse paths  | `setExpandedFolderPaths(Object.fromEntries(paths.map(p => [p, false])))` |
| toggle one path | `setExpandedFolderPaths({ [path]: !current[path] })`                     |
| MUI full list   | `setExpandedFolderPaths(pathsToPresenceRecord(keys), { replace: true })` |
| clear all       | `setExpandedFolderPaths({}, { replace: true })`                          |

Optional tiny helpers (`pathsToTrueRecord` / `pathsToFalseRecord`) only if call sites stay noisy; prefer inline `Object.fromEntries` unless duplication hurts.

`updateExpandedKeys` in orchestration should either disappear or become a thin wrapper that builds a merge/replace record — stop exposing array updaters as the primary API.

### 5. Keep `toggleExpandedKey(string[])` for now

Domain array toggle can remain where a caller still has a path list; prefer record toggle at store boundary. No requirement to rewrite `toggleExpandedKey` in this change unless a caller becomes awkward.

## Risks / Trade-offs

- **[Risk] Falsy keys accumulate** → Acceptable; lookups ignore them. Reconcile/prune already drops non-`true` entries when pruning invalid paths.
- **[Risk] Missed caller still calling `replaceExpandedFolderPaths`** → TypeScript compile error after removal; grep + test suite catch leftovers.
- **[Risk] Merge default surprises a caller that meant full replace** → Document `replace: true` at FileTree MUI handler and any clear-all paths; store tests cover both modes.
- **[Trade-off] `false` left in state vs delete** → Prefer writing `false` (explicit); no mandatory delete pass.

## Migration Plan

1. Implement new `setExpandedFolderPaths` signature + collapse side-effect; remove `replaceExpandedFolderPaths`.
2. Update store unit tests for merge, replace, and `activePath`.
3. Migrate callers and their tests in the same PR (App layer only).
4. Run lint, format:check, test, build.

Rollback: revert the PR; no persisted wire format depends on the action name.
