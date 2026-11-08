# Tasks

## 1. Shared export color helper

- [x] 1.1 Extract `toExportColor` / `hslToHex` (and lightness floor + `#ffffff` fallback) from DOT into `helpers/toExportColor/`, update DOT imports, and move/rename unit tests from `toDotColor` → `toExportColor`. Verify DOT serializer tests and the new helper tests pass

## 2. Mermaid node and edge styles

- [x] 2.1 Extend `serializeGraphToMermaid` to accept `userEdgeHighlights` and emit node/subgraph colors with DOT semantics (`toExportColor` for folder pastels; circular/unresolved/default file styles). Verify unit tests assert style/`classDef` output for folder, circular, and unresolved cases
- [x] 2.2 Emit edges as `eN@-->` with `classDef`/`class` for DOT semantic edge colors, type-only dashed strokes, and user highlight color + thicker stroke. Verify unit tests cover semantic classes, dashed type-only, highlight override, and that former “no styling” expectations are removed/updated
- [x] 2.3 Pass `userEdgeHighlights` into Mermaid serialize from `useDependencyGraphImperativeRef` (mirror DOT). Verify `GraphCanvas` / handle export Mermaid test still downloads `.mmd` and includes a style or `classDef` when fixtures have colored nodes or highlighted edges

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix any issues introduced by this change
