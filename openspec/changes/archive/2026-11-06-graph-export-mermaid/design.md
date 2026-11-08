# Design

## Context

See proposal.md — Why. DOT export already serializes the visible React Flow graph (`layoutNodes` + `baseEdges`) via `serializeGraphToDot`, exposed on `DependencyGraphHandle.exportDot`, wired through orchestration and Quick Pick (`exportGraphDot`), and downloaded with `downloadTextFile('graph.dot', ...)`. Mermaid export should mirror that path without Graphviz Online / mermaid.live.

Visible scope is already decided by ignore patterns, selection, and `expandedFolderPaths` before RF conversion; export MUST reuse that graph, not re-filter the cruise snapshot.

## Goals / Non-Goals

**Goals:**

- Add a topology-only Mermaid serializer over the same RF inputs DOT uses.
- Nested subgraphs for `folderGroup` nodes (parity with DOT clusters / on-screen expansion).
- Stable, Mermaid-safe ids; basename labels matching the canvas.
- Quick Pick command + handle method + i18n, download `graph.mmd` only.

**Non-Goals:**

- Opening mermaid.live or any online Mermaid host.
- Phase-2 styling (`classDef`, colors, circular/unresolved, highlights, type-only dashed).
- Copy-to-clipboard as a separate command (download only in this change).
- Changing DOT export behavior.
- Encoding layout positions (Mermaid lays out itself).

## Decisions

### 1. Mirror the DOT imperative export path

Wire `exportMermaid` on `DependencyGraphHandle` → `useAppOrchestration.exportGraphMermaid` → Quick Pick `exportGraphMermaid`, calling `downloadTextFile('graph.mmd', content, ...)`.

**Why:** Same discovery UX as DOT; minimal new surface.  
**Alternative:** Header/toolbar button — rejected; no dedicated graph export toolbar today.

### 2. Serializer sibling to `serializeGraphToDot`

Add `serializeGraphToMermaid` under GraphCanvas helpers with the same node/edge input shape (minus DOT-only `edgesType` / highlight args for phase 1). Walk `parentId` / `folderGroup` like DOT’s cluster emit: roots → nested subgraphs → leaf nodes; then emit edges among leaf ids.

**Why:** Keeps export logic next to the existing tested serializer pattern.  
**Alternative:** Shared “visible graph IR” extracted for DOT + Mermaid — deferred; not needed for one new format.

### 3. Safe ids from paths; labels from canvas basename

Map each node path to a Mermaid-safe id (e.g. prefixed alphanumeric with `/` and unsafe chars replaced). Never use raw paths as bare ids (`src/foo/default.ts` breaks parsers). Labels use existing node `data.label` (basename), quoted when needed. Subgraph ids must not collide with node ids (distinct prefix, e.g. `sg_` vs `n_`).

**Why:** Mermaid reserved tokens and `/` in ids are known failure modes.  
**Alternative:** Quote path-as-id — still fragile for reserved words inside unquoted contexts; explicit safe map is clearer.

### 4. `flowchart LR`, unstyled edges `A --> B`

Fixed direction per product decision. Phase 1 edges are plain arrows with no classes or stroke styles.

**Why:** Matches agreed scope; keeps large exports simpler.  
**Alternative:** `TB` or style parity with DOT — deferred to phase 2 / later change.

### 5. Filename `graph.mmd`

Parallel to `graph.dot`. MIME type: prefer a text type such as `text/plain` or `text/x-mermaid` (browser download only cares that it downloads).

## Risks / Trade-offs

- **[Risk] Large diagrams still overwhelm Markdown Mermaid renderers** → Mitigation: export only the visible subset (user narrows selection/expansion); no online viewer that already fails on large files.
- **[Risk] Id map collisions if naive replace collapses distinct paths** → Mitigation: deterministic encoding that preserves uniqueness (e.g. replace `/` with a reserved separator and escape that separator in path segments, or hash with readable prefix); cover in unit tests.
- **[Risk] Subgraph title / label escaping (`]`, quotes)** → Mitigation: follow Mermaid quoted-label rules; unit-test special characters.
- **[Trade-off] No styles in phase 1** → Circular/highlight semantics are lost in `.mmd` until a follow-up; topology and folder structure remain correct.

## Migration Plan

- Additive feature only; no data migration.
- Rollback: remove command + serializer; no persisted format change.

## Open Questions

- None for this change. Phase-2 styling is explicitly out of scope and can be a separate change later.
