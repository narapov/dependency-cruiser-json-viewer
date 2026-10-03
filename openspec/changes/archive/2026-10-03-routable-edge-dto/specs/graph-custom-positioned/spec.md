# Spec Delta

## ADDED Requirements

### Requirement: App routable edges are the edge source of truth until React Flow projection

After a successful graph build, the system SHALL maintain an App-owned routable edge collection derived from domain visible-tree edges and frozen ports. Libavoid scheduling, route merge, and in-flight / drag clearance of deferred routes MUST operate on that App collection. React Flow edge objects MUST NOT be the intermediate source of truth for ports, dependency flags, or avoid-route attachment before the presentation projection step.

#### Scenario: Routing and merge use App edges

- **WHEN** libavoid orthogonal routing runs (or clears routes while dragging / in flight)
- **THEN** thin worker edges and merged avoid-route fields are produced from the App routable edge collection
- **AND** that path does not require React Flow `Edge` objects as input

#### Scenario: React Flow edges appear only after projection

- **WHEN** the canvas needs edges for React Flow rendering, highlight wiring that consumes presentation edges, or DOT export from the imperative graph API
- **THEN** those React Flow edges are projected from the current App routable edges (with or without applied avoid routes)
- **AND** the projection happens after routing merge (or after an explicit unrouted / cleared state), not before scheduling libavoid

## MODIFIED Requirements

### Requirement: React Flow adapter is presentation-only for layout

The React Flow integration layer SHALL consume the custom-positioned graph and the App routable edge collection (including any applied avoid routes), project them into React Flow nodes and edges, and bridge drag events by signaling drag state to the canvas and invoking apply-positions. Layout cache merge, invalidate, reflow, and libavoid scheduling MUST NOT live in that React Flow adapter. Libavoid scheduling MUST NOT take React Flow edges as its edge model input.

#### Scenario: Drag bridge

- **WHEN** the user starts dragging a node on the canvas
- **THEN** the canvas drag flag becomes true and apply-positions runs with commit disabled as the drag moves
- **AND** when the drag stops, apply-positions runs with commit enabled and the drag flag becomes false

#### Scenario: Build remains outside both layout hooks' rebuild ownership

- **WHEN** the visible tree or layout revision changes
- **THEN** graph build still runs from the canvas orchestration path
- **AND** the custom-positioned graph is refreshed from the new build result (plus cache merge rules already required by graph-layout-cache)

#### Scenario: Adapter projects routed App edges

- **WHEN** App routable edges have been updated (including after a libavoid result applies or clears)
- **THEN** React Flow edges shown on the canvas are projected from those App edges
- **AND** libavoid scheduling remains outside the React Flow adapter
