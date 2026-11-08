# Tasks

## 1. Shared border width

- [x] 1.1 Add `DEFAULT_EXPORT_NODE_BORDER_WIDTH = 1` next to `DEFAULT_EXPORT_NODE_BORDER` in `toExportColor` and export it from the helper barrel; verify unit test (or existing color tests) can import the constant
- [x] 1.2 Re-export the constant from GraphCanvas helpers `index` if other export helpers are re-exported there; verify TypeScript resolves the import from serializers

## 2. DOT serializer

- [x] 2.1 Emit `penwidth=<DEFAULT_EXPORT_NODE_BORDER_WIDTH>` on leaf nodes in `serializeGraphToDot` and verify DOT unit tests assert `penwidth` on a file leaf
- [x] 2.2 Emit the same `penwidth` on clusters in `serializeGraphToDot` and verify DOT unit tests assert `penwidth` on an expanded folder cluster

## 3. Mermaid serializer

- [x] 3.1 Extend `styleFillStroke` (or equivalent) to include `stroke-width:<width>px` using the shared constant; verify Mermaid tests for folder leaf / subgraph styles include that `stroke-width`
- [x] 3.2 Ensure file `classDef` lines (default / circular / unresolved) include the same `stroke-width`; verify Mermaid unit tests for those classDefs

## 4. Integration check

- [x] 4.1 Run `npm run lint`, `npm run format:check`, and the DOT/Mermaid related Vitest files (or `npm run test`) and verify they pass
