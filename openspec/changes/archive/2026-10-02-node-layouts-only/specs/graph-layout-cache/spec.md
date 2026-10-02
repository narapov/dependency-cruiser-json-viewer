# Spec Delta

## MODIFIED Requirements

### Requirement: Workspace persists group layouts with sizes

Workspace settings SHALL persist the group layout cache as `nodeLayouts` (group width/height and each child's position, width, and height). Loading a workspace MUST migrate any legacy position-only data into that cache shape at the workspace load boundary, then restore `nodeLayouts` before or with the graph rebuild so matching groups recover their layouts. The graph restore path and in-memory workspace state MUST consume `nodeLayouts` only—they MUST NOT re-interpret legacy position maps. Saving a workspace MUST write custom layouts via `nodeLayouts` only and MUST NOT dual-write a parallel position-only map. Legacy workspaces that only store child positions without sizes MUST still be accepted on load: positions are seeded into `nodeLayouts` and incomplete size data does not by itself invent sizes—the next build fills sizes (and may cold-layout groups that cannot be interactively restored).

#### Scenario: Save and reload restores nested layout

- **WHEN** the user saves a workspace after manually arranging nodes inside nested folders and later loads that workspace with the same expansions
- **THEN** those nested child positions and group sizes are restored from the persisted `nodeLayouts` cache

#### Scenario: Legacy positions-only workspace

- **WHEN** a workspace file contains legacy position-only node position data without sizes
- **THEN** the system loads without error, migrates those positions into `nodeLayouts` at load time, and seeds the layout cache for subsequent builds

#### Scenario: Save does not dual-write positions

- **WHEN** the user saves a workspace that has custom group layouts
- **THEN** the saved settings include those layouts under `nodeLayouts` and do not include a parallel non-empty position-only `nodePositions` map

#### Scenario: Graph restore uses layouts only

- **WHEN** workspace settings have been applied to in-memory state after load
- **THEN** the graph restores layout from `nodeLayouts` alone without reading a legacy position map from that state
