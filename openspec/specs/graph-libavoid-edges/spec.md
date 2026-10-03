# graph-libavoid-edges Specification

## Purpose

Provides a selectable libavoid-based orthogonal edge style that routes around graph obstacles off the UI thread, reports phased routing progress to a linear progress bar, uses smooth-step fallback while routing or dragging, and draws schematic hops at crossings.

## Requirements

### Requirement: Libavoid orthogonal edges type

The system SHALL offer `libavoidOrthogonal` as a value of the persisted graph edges type alongside `bezier`, `straight`, and `simpleOrthogonal`. The default edges type MUST remain `bezier`. Workspace load and save MUST accept and round-trip `libavoidOrthogonal`.

#### Scenario: Select libavoid from edges type UI

- **WHEN** the user chooses the libavoid orthogonal edges type from the graph edges-type control or command picker
- **THEN** the workspace graph settings store `edgesType` as `libavoidOrthogonal` and subsequent edge rendering uses that mode

#### Scenario: Default remains bezier

- **WHEN** a workspace has no edges type override
- **THEN** the edges type is `bezier`

#### Scenario: Reload preserves libavoid

- **WHEN** the user saves a workspace with `edgesType` set to `libavoidOrthogonal` and later loads it
- **THEN** the graph restores `libavoidOrthogonal` without error

### Requirement: Worker-backed obstacle-aware orthogonal routes

When `edgesType` is `libavoidOrthogonal` and the graph is not mid-drag, the system SHALL compute orthogonal routes that avoid node obstacles using libavoid in a Web Worker (not on the UI thread). Routing MUST assign stable EAST/WEST ports per edge endpoint, partition edges by lowest common ancestor level (bottom-up), build a hierarchical obstacle graph that collapses folder groups with no endpoints in the current edge batch to opaque rectangles, route edges in batches, and re-route groups of edges whose routes share collinear segment overlaps. Applied routes MUST be absolute canvas coordinates keyed by edge id.

#### Scenario: Routes applied after worker completes

- **WHEN** `edgesType` is `libavoidOrthogonal`, layout is settled, and the worker finishes a routing generation that is still current
- **THEN** edges that received routes render those libavoid paths instead of the smooth-step fallback

#### Scenario: Irrelevant folder is opaque

- **WHEN** a routing batch includes an edge between leaves under folders `a` and `c` and sibling folder `b` has no endpoints in that batch
- **THEN** folder `b` is presented to the router as a single opaque rectangle without its children

#### Scenario: Stale generation discarded

- **WHEN** a newer layout, edges-type change, or drag-stop schedules routing before an older worker result returns
- **THEN** the older result is discarded and does not overwrite edge paths

### Requirement: Smooth-step fallback while routing or dragging

While a libavoid routing job is in flight for the current graph, or while the user is dragging a node with `edgesType` set to `libavoidOrthogonal`, the system SHALL render affected edges with the standard smooth-step orthogonal path (not libavoid paths, including not previously computed libavoid paths). After drag ends, the system MUST clear or ignore live libavoid paths and schedule a new worker routing pass; until that pass completes, edges MUST remain on smooth-step.

#### Scenario: In-flight routing shows smooth-step

- **WHEN** the user switches to `libavoidOrthogonal` (or layout changes) and the worker has not yet returned routes
- **THEN** edges render with smooth-step paths

#### Scenario: Drag suspends libavoid

- **WHEN** the user starts dragging a node while `edgesType` is `libavoidOrthogonal`
- **THEN** edges immediately use smooth-step for the duration of the drag and no libavoid worker work is required to keep the UI responsive for that drag

#### Scenario: Drag stop restarts routing

- **WHEN** the user finishes dragging a node while `edgesType` is `libavoidOrthogonal`
- **THEN** the system schedules a new worker routing pass and continues showing smooth-step until that pass applies

### Requirement: Phased routing progress UI

While a libavoid routing job is in flight (and the graph is not mid-drag), the worker MUST report progress for each routing phase as a completed edge count and a total edge count for that phase. The system SHALL expose at least two phases: primary obstacle-aware routing, then a separate overlap re-route phase. The main thread MUST show a determinate linear progress indicator reflecting the active phase's `completed / total`, and MUST hide the indicator when routing completes, is cancelled, or is suspended for drag. Progress from a stale generation MUST NOT update the indicator.

#### Scenario: Primary phase progress updates

- **WHEN** the worker is in the primary routing phase and finishes another batch of edges
- **THEN** the UI linear progress reflects the new `completed` value against the primary phase `total`

#### Scenario: Overlap phase is separate

- **WHEN** primary routing has finished and the worker starts the collinear-overlap re-route phase
- **THEN** the progress indicator switches to the overlap phase with its own `completed` and `total` (not a continuation that silently stays at 100% of the primary total)

#### Scenario: Progress hidden when idle or dragging

- **WHEN** routing applies successfully, is cancelled by a newer generation, or the user is dragging a node
- **THEN** the linear progress indicator is not shown

### Requirement: Crossing hops on non-emphasized libavoid edges

For edges rendered from libavoid routes, the system SHALL draw schematic semicircle hops of radius 1.5 at proper horizontal×vertical crossings between distinct edges. Hops MUST NOT be drawn on emphasized edges (selected edges, or edges whose stroke differs from the default edge color, including user highlights and other non-default strokes).

#### Scenario: Hop at H×V crossing

- **WHEN** two non-emphasized libavoid edge paths cross as a horizontal segment over a vertical segment
- **THEN** the horizontal edge path includes a hop of radius 1.5 at the crossing

#### Scenario: Emphasized edge has no hops

- **WHEN** a libavoid-routed edge is selected or uses a non-default stroke color
- **THEN** that edge's path is drawn without crossing hops
