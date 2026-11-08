# Proposal

## Why

Users can already export the visible dependency graph as Graphviz DOT for external tooling, but many docs and PR workflows prefer Mermaid. Adding a Mermaid (`.mmd`) export lets people paste the current visible graph into Markdown without leaving the viewer’s selection and folder-expansion model.

## What Changes

- Add a Quick Pick command that downloads the currently visible graph as a Mermaid flowchart (`.mmd`).
- Serialize visible React Flow nodes and edges to `flowchart LR` with nested subgraphs for expanded folders.
- Use safe Mermaid node/subgraph ids with basename labels (paths may contain `/` and reserved words).
- Phase 1 is topology only: no colors, highlights, circular/unresolved styling, or dashed type-only edges.
- Do not open mermaid.live (it fails on large diagrams); download only, mirroring the DOT download path without the online viewer.

## Capabilities

### New Capabilities

- `graph-export-mermaid`: Export the visible dependency graph as a Mermaid flowchart file via a user command.

### Modified Capabilities

- (none)

## Impact

- `DependencyGraphHandle` gains an `exportMermaid()` method alongside existing DOT export.
- New serializer helper next to `serializeGraphToDot` (App GraphCanvas helpers).
- Quick Pick / orchestration / i18n keys for the new command (all five locales).
- Reuses `downloadTextFile`; no new runtime dependencies.
- Existing DOT export and Graphviz Online remain unchanged.
