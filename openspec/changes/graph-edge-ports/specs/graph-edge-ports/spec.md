# Spec Delta

## Purpose

Assigns stable per-edge EAST/WEST attachment ports during graph build and uses that map for edge path endpoints and libavoid routing without rendering per-port Handles.

## ADDED Requirements

### Requirement: Build-time edge port map

After laying out the visible dependency graph, the system SHALL compute a port map keyed by edge id. For each edge the map MUST record a source port on the EAST side of the source node and a target port on the WEST side of the target node. Ports on the same node side MUST be ordered top-to-bottom by the opposite endpoint's absolute center Y at build time. Each port MUST include a node-relative `y` equal to `(index + 1) / (count + 1) * nodeHeight` for that side's slot count. The map MUST be frozen for that build: dragging nodes MUST NOT recompute port indices or relative `y` values.

#### Scenario: Multiple outgoing edges get distinct EAST slots

- **WHEN** a node has three outgoing edges whose targets have different absolute center Y values
- **THEN** those edges receive three EAST ports with increasing `y` from top to bottom matching target Y order

#### Scenario: Drag keeps relative port y

- **WHEN** the user drags a node after a build that assigned ports
- **THEN** each edge's stored relative port `y` values remain unchanged while absolute attachment points move with the node's absolute position

### Requirement: Edge paths use port map without per-port Handles

When rendering a dependency edge that has an entry in the port map, the system SHALL use absolute attachment points derived from the source/target node absolute positions plus the stored relative port `y` (EAST at node width, WEST at x = 0). The system MUST NOT require a distinct React Flow Handle DOM node per port for those attachment points. Edges without a port-map entry MAY keep the previous single Left/Right handle behavior.

#### Scenario: Path endpoints follow ports

- **WHEN** an edge has port-map entries with source `y = H/4` and target `y = H/2`
- **THEN** the rendered path starts at the source node's absolute right side at relative `y = H/4` and ends at the target node's absolute left side at relative `y = H/2`

#### Scenario: Fallback edges types share ports

- **WHEN** edges type is bezier, straight, or simpleOrthogonal and the edge has port-map data
- **THEN** the path still uses those port-derived endpoints

### Requirement: Libavoid reuses the port map

When routing with `libavoidOrthogonal`, the system SHALL use the build-time port map for libavoid EAST/WEST port geometry and edge–port linkage. It MUST NOT independently reassign port indices solely for routing when the map is present for those edges.

#### Scenario: Libavoid slots match build map

- **WHEN** libavoid routes an edge that has build-time ports
- **THEN** the router’s source and target port positions match the map’s relative `y` (and EAST/WEST sides) for that edge
