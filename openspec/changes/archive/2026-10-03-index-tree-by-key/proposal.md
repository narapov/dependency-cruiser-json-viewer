# Proposal

## Why

GraphCanvas and libavoid helpers duplicate the same DFS that indexes a tree into a `Map` keyed by path (`indexLayoutedNodes` in `buildGraph` and `getEdgesPorts`, `flattenThinRoutingTree`). A shared domain helper removes the copies and gives a reusable API for future tree→map needs.

## What Changes

- Add domain `indexTreeByKey(roots, getKey)` that walks trees with optional `children` and returns `Map<TKey, TNode>`.
- `getKey(node, ancestors)` receives ancestor nodes nearest→root (empty at roots) so callers can build keys from lineage later without an API break.
- Replace duplicated index/flatten helpers in GraphCanvas with this function; delete `flattenThinRoutingTree` (or reduce to a one-liner wrapper only if a named export is still useful—prefer delete).
- Leave roots-only maps (`new Map(roots.map(...))`) as local call sites—they are not full-tree indexes.

## Capabilities

### New Capabilities

- `tree-index-by-key`: Generic indexing of nested tree nodes into a key→node map via a caller-supplied key function that receives the node and its ancestor chain.

### Modified Capabilities

- (none)

## Impact

- New helper under `src/domain/helpers/` (e.g. `treeUtils/indexTreeByKey`)
- `buildGraph`, `getEdgesPorts`, libavoid `flattenThinRoutingTree` call sites / folder
- Unit tests for the domain helper; update GraphCanvas tests that duplicated the walk
