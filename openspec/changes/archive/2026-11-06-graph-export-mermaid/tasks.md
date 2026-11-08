# Tasks

## 1. Mermaid serializer

- [x] 1.1 Add `serializeGraphToMermaid` (and id/label escaping helpers) under GraphCanvas helpers next to DOT export; export from the helpers barrel. Verify unit tests cover: `flowchart LR` header, nested subgraphs for `folderGroup`, collapsed folder as leaf, unique safe ids for path/`default`/`end`-like names, basename labels, plain `-->` edges, and absence of style directives
- [x] 1.2 Wire `exportMermaid()` on `DependencyGraphHandle` via `useDependencyGraphImperativeRef` to serialize current `layoutNodes`/`baseEdges` and `downloadTextFile('graph.mmd', ...)`. Verify handle typing compiles and the method exists alongside `exportDot`

## 2. Command and i18n

- [x] 2.1 Add `exportGraphMermaid` on orchestration and a Quick Pick command next to DOT export. Verify `useAppCommands` / orchestration tests assert the new id and that execute delegates to the graph handle
- [x] 2.2 Add `commands.exportGraphMermaid` (and any related keys) to all five locale files (`en`, `fr`, `de`, `ru`, `es`). Verify `npm run test` still passes for command label resolution patterns used elsewhere

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; fix any issues introduced by this change
