# graph-thin-routing-worker Specification

## Purpose

Defines that the libavoid routing worker receives a thin tree DTO projected only at the worker boundary from the layouted visible tree, without a separate routing tree on the graph build result.

## Requirements

### Requirement: Build result has no separate routing tree

When a successful graph build completes, the system SHALL expose layouted geometry and hierarchy only through the layouted node index / tree on the build result. The build result MUST NOT include a separate pre-projected routing-tree field whose only purpose is to strip layouted nodes for libavoid.

#### Scenario: Build result omits routingTree

- **WHEN** a successful graph build completes
- **THEN** consumers obtain layouted nodes with positions, sizes, ancestors, and descendants from the layouted tree fields
- **AND** the build result does not expose a distinct `routingTree` (or equivalent pre-thinned copy) field

### Requirement: Thin routing tree is produced only at the worker boundary

When scheduling libavoid orthogonal routing, the system SHALL project the current layouted visible tree into a thin routing-tree DTO in a single boundary operation used for the worker payload. That projection MUST include only fields needed for routing (path, ancestors, descendants, relative geometry, nested children) and MUST apply any live geometry overlay (for example post-drag React Flow positions/sizes) in the same walk. The main-thread libavoid scheduling path MUST NOT keep a long-lived thinned tree that duplicates the layouted tree.

#### Scenario: Worker payload is thin tree plus thin edges

- **WHEN** a libavoid routing generation starts after layout settles
- **THEN** the worker receives a thin routing tree and thin edges keyed by the same node paths as the layouted graph
- **AND** the thin tree nodes do not carry UI-only layouted fields such as circular flags

#### Scenario: Live geometry overlay at the boundary

- **WHEN** the user finishes dragging a node with libavoid orthogonal edges active
- **THEN** the next worker request’s thin tree reflects post-drag relative geometry for affected nodes
- **AND** the system does not rebuild the domain cruise visible tree solely to refresh routing geometry

#### Scenario: Ports remain on thin edges

- **WHEN** an edge has frozen EAST/WEST ports from layout
- **THEN** those ports are present on the corresponding thin edge in the worker payload

### Requirement: Thin routing node is the worker wire type

The thin routing-tree node type used in the worker payload SHALL be named and documented as a thin / wire DTO (paired with thin routing edges), not as an “enriched” layouted node. Worker-side flattening, ancestors-based LCA partitioning, and obstacle construction MUST continue to use that thin tree (and its indexes) without React Flow node arrays as the primary hierarchy source.

#### Scenario: Worker flattens thin tree by path

- **WHEN** the worker receives a thin routing tree with nested children
- **THEN** edge level assignment looks up endpoints in a path→node map built from that thin tree
