# graph-custom-positioned Specification

## Purpose

Separates custom-positioned graph state (live geometry, layout cache commits, edge routing) from React Flow presentation so drag and rebuild share one positioned model without RF node types as the source of truth.

## Requirements

### Requirement: Custom-positioned graph is the live geometry source of truth

After a successful graph build (and after each position apply), the system SHALL maintain a custom-positioned graph that is a layouted copy of the build result with current parent-relative positions and sizes. React Flow nodes MUST be derived from that custom-positioned graph for display. Live drag geometry MUST NOT treat React Flow node objects as the durable source of truth for positions or group sizes.

#### Scenario: Build seeds custom-positioned graph

- **WHEN** a graph build completes with layouted nodes
- **THEN** the custom-positioned graph mirrors those layouted positions and sizes
- **AND** React Flow nodes shown on the canvas are projected from that graph

#### Scenario: Drag updates custom-positioned graph first

- **WHEN** the user drags a node while auto-layout-only mode is off
- **THEN** the custom-positioned graph reflects settled sibling positions and grown ancestor sizes
- **AND** React Flow display nodes are updated from that graph (not the reverse)

### Requirement: Apply positions with optional cache commit

The system SHALL expose a single apply-positions operation that accepts a map of path to new parent-relative position and an option whether to commit into the durable group layout cache. When commit is false, the operation MUST update only the live custom-positioned graph (including cascading sibling settle with the moved node fixed, and ancestor group resize). When commit is true, the operation MUST perform the same live update and then write affected group layout cache entries from the resulting geometry. Applying positions MUST NOT start a graph rebuild solely for that apply.

#### Scenario: Preview during drag does not commit cache

- **WHEN** positions are applied with commit disabled (for example while a drag is in progress)
- **THEN** live custom-positioned geometry updates with settle and ancestor resize
- **AND** durable layout cache entries are not rewritten for that apply

#### Scenario: Commit on drag stop writes cache

- **WHEN** positions are applied with commit enabled after a drag ends
- **THEN** live geometry matches the settled result
- **AND** layout cache entries for the affected group and ancestor groups are updated from that geometry
- **AND** no graph rebuild is started solely for that apply

#### Scenario: Dragged node stays fixed during settle

- **WHEN** applied positions move a node so it overlaps a sibling
- **THEN** the moved node remains at the applied position
- **AND** overlapping siblings are pushed downward in a cascading top-down settle (same rules as build settle)

### Requirement: Custom-positioned graph owns edge routing inputs

When libavoid (or equivalent deferred orthogonal) routing is active, the system SHALL derive routing geometry from the custom-positioned graph and SHALL pause or clear deferred routes while a drag is in progress (`isDragging` true). The React Flow presentation layer MUST NOT be required as the geometry source for routing.

#### Scenario: Routing uses custom-positioned geometry

- **WHEN** edge style is libavoid orthogonal and the user is not dragging
- **THEN** routes are computed from the custom-positioned graph geometry

#### Scenario: Drag suppresses deferred routes

- **WHEN** `isDragging` is true
- **THEN** deferred libavoid routes are cleared or not applied so edges fall back to a non-deferred path style until drag ends

### Requirement: React Flow adapter is presentation-only for layout

The React Flow integration layer SHALL consume the custom-positioned graph and routed edges, project them into React Flow nodes and edges, and bridge drag events by signaling drag state to the canvas and invoking apply-positions. Layout cache merge, invalidate, reflow, and libavoid scheduling MUST NOT live in that React Flow adapter.

#### Scenario: Drag bridge

- **WHEN** the user starts dragging a node on the canvas
- **THEN** the canvas drag flag becomes true and apply-positions runs with commit disabled as the drag moves
- **AND** when the drag stops, apply-positions runs with commit enabled and the drag flag becomes false

#### Scenario: Build remains outside both layout hooks' rebuild ownership

- **WHEN** the visible tree or layout revision changes
- **THEN** graph build still runs from the canvas orchestration path
- **AND** the custom-positioned graph is refreshed from the new build result (plus cache merge rules already required by graph-layout-cache)
