# Proposal

## Why

Phase-1 Mermaid export is topology-only, so circular modules, folder pastels, and highlighted edges disappear in `.mmd` while DOT keeps them. Users who export for docs need the same semantic and folder colors they see on the canvas (and in DOT).

## What Changes

- Extend Mermaid export with node/subgraph fill and stroke colors matching DOT export semantics (folder pastels, circular/unresolved files, defaults).
- Style edges via Mermaid edge ids + `classDef` for DOT semantic colors, type-only dash, user edge highlights, and thicker stroke when highlighted.
- Extract shared UI→export hex normalization: rename `toDotColor` → `toExportColor` (with `hslToHex` / lightness floor) for DOT and Mermaid.
- **BREAKING** (Mermaid consumers): phase-1 “no style directives” behavior ends; exported `.mmd` includes `style` / `classDef` / edge ids (`eN@-->`). Older Mermaid hosts that lack edge-id classes may ignore or fail those lines — accepted.
- Depends on change `graph-export-mermaid` (implemented; capability not yet archived into main specs).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `graph-export-mermaid`: Replace topology-only styling ban with DOT-parity node and edge colors in the Mermaid download (capability introduced by `graph-export-mermaid`; still only in that change’s delta until archived).

## Impact

- `serializeGraphToMermaid` gains colors + edge classes; input includes `userEdgeHighlights`.
- New shared helper `toExportColor` under GraphCanvas helpers; DOT serializer updated to use it.
- Imperative export path already passes highlights into DOT — Mermaid wiring must pass the same map.
- Unit tests for Mermaid/DOT color helpers; no new runtime dependencies; no new Quick Pick command.
