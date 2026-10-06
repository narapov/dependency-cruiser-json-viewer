# Design

## Context

See proposal.md for motivation.

**Already shipped (v1):** hard-coded rewrite to `node:/<id>`, flat under `node:`, default selection excluding `node:`.

**Superseded direction:** protocol roots at tree root + default `node:` — rejected. Missing protocol must stay bare; one pocket `:buildIn:` holds all core leaves.

Cruise shape (observed):

- Core **modules** usually have no `protocol`.
- Core **dependencies** often have `protocol: "node:"`, sometimes unset.
- Protocols already include the trailing colon (`node:`, `bun:`).

## Goals / Non-Goals

**Goals:**

- Single synthetic root `:buildIn:` for all `coreModule` endpoints.
- Leaf = `protocol + id` when protocol is set, else bare `id` — never invent `node:`.
- Flat topology under `:buildIn:` (slashes inside the leaf are part of the name).
- Default selection excludes `:buildIn:`.

**Non-Goals:**

- Per-protocol folders under `:buildIn:` or at tree root.
- Defaulting unset protocol to `node:`.
- Bucketing unresolved non-core roots; QuickPick tiers; mutating `originModule.source`.

## Decisions

### 1. Root and leaf formula

**Choice:**

- Root constant: `:buildIn:`
- Leaf name: `protocol ? `${protocol}${cruiseId}` : cruiseId`
- Snapshot path: `` `:buildIn:/${leaf}` ``

Examples:

| cruise id    | protocol | snapshot path               |
| ------------ | -------- | --------------------------- |
| `crypto`     | unset    | `:buildIn:/crypto`          |
| `fs`         | `node:`  | `:buildIn:/node:fs`         |
| `path/posix` | `node:`  | `:buildIn:/node:path/posix` |
| `fs`         | `bun:`   | `:buildIn:/bun:fs`          |

`node:path/posix` is a **single** module title (basename), not nested folders.

**Rationale:** Honest to cruise; URI-style `node:fs` is recognizable; one root avoids protocol folders at project level.

### 2. Detect with `coreModule`

**Choice:** Only rewrite when `coreModule` is true on the module or dependency.

### 3. Placement and edges

**Choice:**

- **Edges:** for `dep.coreModule`, target path = `:buildIn:/` + leaf from `dep.protocol` + `dep.resolved`.
- **Tree:** for each core cruise module, collect distinct leaf names from inbound core deps (same formula). If none, emit one leaf with bare `module.source`. Each leaf shares the same `originModule`.
- Distinct leaves for bare vs protocol-prefixed (and across protocols) are expected, not merged.

### 4. Path utils: flat under `:buildIn:`

**Choice:** Evolve helpers from v1 `node:`-only to `:buildIn:` namespace:

| path                        | parent      | ancestors     | basename          |
| --------------------------- | ----------- | ------------- | ----------------- |
| `:buildIn:`                 | `null`      | `[]`          | `:buildIn:`       |
| `:buildIn:/crypto`          | `:buildIn:` | `[:buildIn:]` | `crypto`          |
| `:buildIn:/node:path/posix` | `:buildIn:` | `[:buildIn:]` | `node:path/posix` |

Any path starting with `:buildIn:/` has parent `:buildIn:` and basename = slice after `:buildIn:/`. Do not walk internal `/`.

Replace / alias v1 `NODE_BUILTIN_*` / `isNodeBuiltinPath` / `toNodeBuiltinSnapshotPath` toward `:buildIn:` naming (e.g. `BUILT_IN_ROOT`, `toBuiltInSnapshotPath(leaf)` or `(id, protocol?)`).

### 5. Default selection

**Choice:** Exclude files under `:buildIn:` (ancestor or path predicate), in addition to `node_modules`.

### 6. Cycles

**Choice:** When rewriting a bare core cycle member, map to `:buildIn:/` + bare id when that leaf exists; if only protocol-prefixed leaves exist, prefer a stable pick (e.g. sorted leaf names, prefer one starting with `node:` if present). Rare for cores.

## Risks / Trade-offs

- [Both `:buildIn:/fs` and `:buildIn:/node:fs`] → Honest; UI shows both when cruise mixed unset and `node:` imports.
- [v1 `node:/…` paths in tests/settings] → Update tests; soft reconcile drops stale keys.
- [Root spelling `:buildIn:`] → Unusual on purpose (not a real FS folder); keep exact string.

## Migration Plan

Replace v1 `node:` rewrite with `:buildIn:` + leaf formula in the same change apply (tasks section 5). No persisted schema bump.

## Open Questions

None — root, leaf formula, and flat rules confirmed.
