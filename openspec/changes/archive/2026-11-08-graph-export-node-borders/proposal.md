# Proposal

## Why

DOT and Mermaid exports already emit node and cluster border _colors_, but they omit an explicit border _width_. Edges set `penwidth` / `stroke-width`; nodes do not. In several viewers the frame around leaves and folder groups therefore disappears or looks hairline-thin compared with the canvas (`border: 1` / `2`).

## What Changes

- Add a shared export node border width constant and apply it in both serializers:
  - DOT: `penwidth` on leaf nodes and clusters (alongside existing `color`).
  - Mermaid: `stroke-width` on leaf `style` / file `classDef` and subgraph styles (alongside existing `stroke`).
- Keep existing border _colors_ unchanged (`DEFAULT_EXPORT_NODE_BORDER`, circular/unresolved borders).
- Assumption (from explore): one shared width for all export nodes and clusters — `1` (DOT points / Mermaid `1px`), matching canvas file borders; folder groups on canvas use `2`, but export uses a single width for parity and simplicity.

## Capabilities

### New Capabilities

- `graph-export-node-borders`: Shared obligation that Graphviz DOT and Mermaid exports draw leaf and folder-group borders with an explicit width, not only a stroke color.

### Modified Capabilities

- `graph-export-mermaid`: Node and subgraph style directives MUST include `stroke-width` consistent with the shared export border width (DOT uses the same width as `penwidth`).

## Impact

- `toExportColor` (or adjacent export helper): new shared border-width constant.
- `serializeGraphToDot`: leaf + cluster attrs gain `penwidth`.
- `serializeGraphToMermaid`: `styleFillStroke` / file `classDef` gain `stroke-width`.
- Unit tests for both serializers; no new commands, deps, or UI.
