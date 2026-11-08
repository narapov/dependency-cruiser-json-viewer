# Design

## Context

See proposal.md — Why. Phase-1 Mermaid export (`serializeGraphToMermaid`) emits topology only. DOT export already encodes node fills, cluster bgcolor, edge colors, type-only dashed, and user highlights via `serializeGraphToDot`, with UI pastel → hex in `toDotColor` / `hslToHex`.

Sibling change `graph-export-mermaid` is implemented but not archived; this change assumes that serializer and command exist.

## Goals / Non-Goals

**Goals:**

- Shared `toExportColor` used by DOT and Mermaid.
- Mermaid node/subgraph colors aligned with DOT.
- Mermaid edges: `eN@-->` + `classDef` / `class` for DOT semantic colors, type-only dash, highlight color + thicker stroke.
- Pass `userEdgeHighlights` into Mermaid serialize (same as DOT).

**Non-Goals:**

- Online Mermaid viewer / clipboard command.
- Matching libavoid/bezier geometry in Mermaid.
- Supporting Mermaid versions without edge-id classes (explicitly out of scope).
- Changing Quick Pick command set (same `exportGraphMermaid`).

## Decisions

### 1. Extract `toExportColor` next to serializers

Move `toDotColor`, `hslToHex`, and `MIN_EXPORT_FILL_LIGHTNESS` (plus unparseable-color fallback `#ffffff`) into `helpers/toExportColor/`. Re-export from the GraphCanvas helpers barrel. Update DOT call sites and tests (`toDotColor` → `toExportColor`). Keep `parsePastelHsl` in `assignFolderColors`.

**Why:** Single normalization for DOT + Mermaid; name no longer Graphviz-specific.  
**Alternative:** Duplicate hex conversion in Mermaid — rejected.

### 2. Node styles: per-id `style` (or class per unique fill)

Folder pastels are mostly unique hues → emit `style <nodeOrSubgraphId> fill:…,stroke:…` (and `color` for text if needed). For repeated semantic file states (circular / unresolved / default), prefer small fixed `classDef` set + `class` / `:::`, matching DOT constants.

Reuse the same hex constants / resolution order as DOT (`getFileNodeColors`, folder `backgroundColor` → `toExportColor`).

**Why:** Parity with DOT without inventing a second color matrix.  
**Alternative:** Only `classDef` for folders — awkward when every folder has a distinct pastel.

### 3. Edges: named ids + semantic `classDef`

Emit edges as `source eN@--> target` with stable `e0…eN` (or encoded edge key). Define:

| class                  | DOT source                                   |
| ---------------------- | -------------------------------------------- |
| `edgeError`            | couldNotResolve / severity error             |
| `edgeCircular`         | valueCircular                                |
| `edgeTypeOnlyCircular` | typeOnlyCircular                             |
| `edgeWarn`             | severity warn                                |
| `edgeDefault`          | optional; may omit and leave Mermaid default |

Type-only: include `stroke-dasharray` on the applicable class, or a parallel `…TypeOnly` class when dash must combine with another semantic color.

User highlights: `classDef` keyed by normalized hex (e.g. `edgeHl_<hexWithoutHash>`), thicker `stroke-width` like DOT penwidth 3; highlight wins over base semantic color (same as DOT).

Wire `userEdgeHighlights` through `buildMermaid` in `useDependencyGraphImperativeRef` like `buildDot`.

**Why:** User requested classDefs; edge ids avoid fragile `linkStyle` indices; modern Mermaid only is accepted.  
**Alternative:** `linkStyle` by index — wider host support, rejected by product choice.

### 4. Color / stroke constants

Prefer sharing DOT’s exported hex literals (or a tiny `exportGraphColors` module) so Mermaid and DOT cannot drift. Do not pull in React Flow visual-style CSS variables.

## Risks / Trade-offs

- **[Risk] Mermaid hosts without edge-id `class` support** → Accepted; document in proposal. Topology still readable if styles are dropped.
- **[Risk] Combining type-only dash + semantic/highlight color** → Mitigation: explicit class matrix or dash property on each classDef used for type-only edges; cover in unit tests.
- **[Risk] Unique highlight colors explode classDef count** → Mitigation: one classDef per distinct highlight hex in the export; typically small.
- **[Trade-off] `style` lines for every folder** → Larger `.mmd`; acceptable for visible-subset export.

## Migration Plan

- Additive to Mermaid file contents; no workspace schema change.
- Archive order: archive `graph-export-mermaid` before or with this change so main `graph-export-mermaid` spec exists before/when this MODIFIED delta merges.
- Rollback: revert serializer + `toExportColor` extract (or keep helper and drop Mermaid styles only).

## Open Questions

- None.
