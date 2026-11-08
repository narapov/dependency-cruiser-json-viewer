# Tasks

## 1. Mermaid curve mapper and serialize input

- [x] 1.1 Add `toMermaidCurve(edgesType)` with the locked mapping (`bezier`→`basis`, `straight`→`linear`, both ortho→`step`) and unit tests covering all `GraphEdgesType` values (verify mapper tests pass)
- [x] 1.2 Extend `SerializeGraphToMermaidInput` with `edgesType` and always emit `%%{init: {'flowchart': {'curve': '…'}}}%%` as the first line before `flowchart LR`; update existing serializer tests to pass `edgesType` and assert the init prefix (verify serializer tests pass, including always-emit for `basis`)

## 2. Wire export path

- [x] 2.1 Pass `edgesType` from `useDependencyGraphImperativeRef` `buildMermaid` into `serializeGraphToMermaid` (same value already used for DOT) and adjust GraphCanvas / command tests if they assert Mermaid file start content (verify affected tests pass)

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run format:check`, and `npm run test` and confirm they pass for this change
