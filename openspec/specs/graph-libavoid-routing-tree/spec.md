# graph-libavoid-routing-tree Specification

## Purpose

Defines the libavoid worker’s graph intake as an enriched layouted visible tree plus thin edges, so routing uses Map indexes and ancestors-based LCA instead of React Flow node arrays.

## Requirements

### Requirement: Enriched layouted visible tree for routing

After layout produces a visible tree with relative position and size per node, the system SHALL enrich each layouted visible-tree node with:

- `ancestors`: ordered list of ancestor folder paths from nearest parent toward the virtual canvas root (empty at roots)
- `descendants`: the set of all visible node paths (folders and files) strictly below that node in the visible tree

Enrichment MUST run on the layouted visible tree used for routing (not on the domain cruise visible tree before layout). Relative `position`, `width`, and `height` MUST remain on each enriched node.

#### Scenario: Folder carries ancestors and descendants

- **WHEN** layout finishes for a visible tree where folder `src` contains file `src/a.ts` and nested folder `src/util` with file `src/util/b.ts`
- **THEN** the enriched node for `src/util` has `ancestors` starting with `src`, and `descendants` that include `src/util/b.ts` and do not include `src` or `src/util` itself
- **AND** the enriched node for `src/a.ts` has `ancestors` starting with `src` and an empty descendants collection

#### Scenario: Root has empty ancestors

- **WHEN** a layouted node is a root of the visible tree
- **THEN** its enriched `ancestors` list is empty

### Requirement: Worker intake is enriched tree plus thin edges

When scheduling libavoid orthogonal routing, the system SHALL post to the routing worker a structured-clone-friendly payload that includes:

- the enriched layouted visible tree (roots with nested `children`)
- thin edges: each with id, source path, target path, and optional frozen source/target ports

The worker request MUST NOT require React Flow `Node` / `Edge` types or a separate flat `parentByNode` array as the primary hierarchy source. Parent and children relationships for routing MUST be derived from the enriched tree (and `ancestors`) inside the worker.

#### Scenario: Payload has tree and thin edges

- **WHEN** a libavoid routing generation starts after layout settles
- **THEN** the worker receives an enriched tree and thin edges keyed by the same node paths as the layouted graph
- **AND** the payload does not depend on React Flow node arrays for hierarchy

#### Scenario: Ports remain on thin edges

- **WHEN** an edge has frozen EAST/WEST ports from layout
- **THEN** those ports are present on the corresponding thin edge in the worker payload

### Requirement: Worker flattens tree to Map and partitions by ancestors LCA

Inside the routing worker (or equivalent pure routing entry used by the worker), the system SHALL:

1. Flatten the enriched tree into a `Map` from path to enriched node
2. For each thin edge whose endpoints exist in that map, compute the lowest common ancestor using the endpoints’ path plus their `ancestors` lists (nearest → root), treating no common ancestor as the virtual canvas root
3. Assign each such edge to exactly one routing level at that LCA, distinguishing leaf↔leaf edges among direct children of the LCA from cross-folder edges at that LCA
4. Build obstacle graphs for flat and hierarchical batches using that map and the tree’s children; when collapsing an opaque folder with no endpoints in the current batch, use `descendants` (or an equivalent Map-backed membership check derived from the enriched tree) instead of scanning React Flow nodes

Observable routing outcomes (obstacle-aware orthogonal routes, opaque irrelevant folders, multi-pass overlap re-route, progress phases) MUST remain consistent with the existing libavoid orthogonal edges behavior.

#### Scenario: LCA uses ancestors lists

- **WHEN** an edge connects `src/a.ts` and `src/util/b.ts` and both nodes list `src` in their ancestor chains
- **THEN** that edge is assigned to the routing level whose parent is `src`

#### Scenario: Flatten before level partition

- **WHEN** the worker receives an enriched tree with nested children
- **THEN** edge level assignment looks up endpoints in a path→node `Map` built from that tree rather than by linear search over a flat React Flow node list

#### Scenario: Opaque folder uses descendants

- **WHEN** a hierarchical routing batch has no endpoints under sibling folder `b`, and `b` appears in the enriched tree with non-empty descendants
- **THEN** folder `b` is presented to the router as a single opaque rectangle without expanding those descendants as separate obstacles

### Requirement: Geometry updates without rebuilding cruise visible tree

After a user finishes dragging a node while libavoid orthogonal edges are active, the system SHALL update relative position (and size if needed) on the enriched layouted tree used for routing—or apply an equivalent geometry overlay before posting—and schedule a new worker pass. The system MUST NOT rebuild the domain cruise visible tree solely to refresh routing geometry.

#### Scenario: Drag stop posts updated geometry

- **WHEN** the user finishes dragging a node with `edgesType` set to `libavoidOrthogonal`
- **THEN** the next worker request reflects the post-drag relative geometry for affected nodes
- **AND** routing still uses the enriched tree + thin edges intake
