# graph-layout-cache Specification

## Purpose

Maintains durable per-folder graph layouts across rebuilds, collapse/expand, drag, and workspace save/load by combining a group layout cache with ELK interactive layout during graph builds.

## Requirements

### Requirement: Group layout cache shape

The system SHALL maintain a group layout cache keyed by group id (empty string for the root viewport group). Each entry MUST include the group's width and height and a map of direct children, each with id, parent-relative position, width, and height. The cache MUST retain entries for groups that are not currently visible (for example collapsed folders) until those entries are invalidated or pruned against the cruise snapshot.

#### Scenario: Collapsed folder keeps layout entry

- **WHEN** a folder group is collapsed after its children were laid out
- **THEN** the cache still contains that folder's group entry with child positions and sizes

#### Scenario: Cache entry structure

- **WHEN** a group has been laid out
- **THEN** its cache entry exposes group width/height and each direct child's id, position, width, and height

### Requirement: Build applies cache with interactive layout

When building the visible dependency graph, the system SHALL pass the layout cache into the build. For each visible group whose cached child-id set exactly matches the visible direct children, the build MUST seed ELK with those children's cached positions and sizes using interactive layered strategies and MUST use the cached group size as the starting parent size. For a group whose child-id set does not match its cache entry (or that has no entry), the system MUST invalidate that group's cache entry and cold-layout that group with ELK.

#### Scenario: Matching membership restores layout

- **WHEN** a folder is re-expanded and its visible direct child ids match the cached entry
- **THEN** those children appear at their cached positions (subject to interactive ELK placement) without discarding the group's remembered layout

#### Scenario: Membership change invalidates group

- **WHEN** a group's visible direct child ids differ from the ids in its cache entry
- **THEN** that group entry is invalidated and the group is cold-laid out

#### Scenario: Child size change with same membership

- **WHEN** a group's child-id set matches the cache but a child's width or height changed (for example a folder leaf becoming an expanded group)
- **THEN** the group entry is not invalidated solely for that size change, and the build seeds the new size with the cached position for that child

### Requirement: Build resolves sibling overlaps after cache apply

After applying cached child positions for a membership-matched group (and after nested children have their current sizes), the build MUST resolve axis-aligned overlaps among that group's direct siblings with a cascading top-down settle: siblings are considered in ascending `y` then `x` order; each non-settled sibling keeps its `x` and is pushed downward only as far as needed so it clears already-settled siblings above it (using the layout vertical gap). The build MUST NOT teleport a sibling below unrelated lower siblings when an intermediate cascade would clear the overlaps. Ancestor group bounds MUST grow from the settled children. Because `layoutChildren` runs bottom-up, a group that grew after settle is handled when its parent group settles its siblings.

#### Scenario: Expand above a manually moved sibling

- **WHEN** sibling `B` was previously moved so it sits below sibling `A`, and `A` is later expanded (or otherwise grows) such that `A`'s new bounds overlap `B` at the cached positions
- **THEN** after the build applies the cache, `B` is pushed just below `A` (plus gap), and any sibling that `B` then overlaps is pushed in turn—not jumped under in one step

#### Scenario: Stack a > b > c stays ordered after grow

- **WHEN** three vertically stacked siblings `A`, `B`, `C` (`A` above `B` above `C`) have cached positions and `A`'s height increases enough to overlap `B`
- **THEN** settle yields `B` directly below `A` and `C` directly below `B` (each with gap), preserving the vertical order

### Requirement: Build merges visible groups back into the cache

After a successful graph build, the system SHALL update cache entries for all visible groups from the laid-out geometry and MUST NOT remove or overwrite cache entries for groups that were not part of that build's visible tree.

#### Scenario: Hidden groups survive rebuild

- **WHEN** the graph rebuilds while some previously laid-out folders remain collapsed
- **THEN** those collapsed folders' cache entries remain available for a later expand

### Requirement: Drag updates cache without rebuild

While the user drags a node (and auto-layout-only mode is off), the system SHALL update live node positions and the layout cache using the same cascading top-down vertical settle as the build path, except the dragged node MUST remain fixed at the drag position through settle (it is not pushed by overlap resolution). Overlaps among siblings MUST cascade (`A` pushes `B`, `B` pushes `C`) rather than teleporting an overlapped sibling below an unrelated lower sibling. Nested graph nodes MUST NOT be constrained by a parent-only move extent that forbids parent-relative coordinates outside the parent's current box (including negative coordinates).

After settle for an affected folder group, the system MUST compact that group's direct children to the same content origin the build uses for folder groups (horizontal inner padding; vertical header height plus that padding): the minimum child parent-relative position MUST equal that origin on both axes. All direct children of the group SHALL be shifted by the same signed delta (`origin - min`), and the folder group itself SHALL be shifted by the opposite delta in its parent's coordinate space so world positions of those children are unchanged. This MUST run both when children overflow left/above the origin (group grows that way) and when the leftmost or topmost child moves inward and leaves excess inset (group shrinks that inset). The group's width and height MUST then be resolved from the children's bounding box plus the usual outer padding (and empty-group minima). Ancestor groups MUST apply the same settle → compact → resize sequence as geometry bubbles upward. The system MUST NOT trigger a graph rebuild solely because of the drag.

#### Scenario: Drag does not rebuild

- **WHEN** the user finishes dragging a node
- **THEN** the node's (and affected siblings'/ancestors') geometry is reflected in the layout cache and no graph build is started for that drag

#### Scenario: Overlap pushes siblings down

- **WHEN** a dragged node overlaps a sibling
- **THEN** that sibling is moved downward until the overlap is cleared, and ancestor groups grow if children exceed their bounds

#### Scenario: Drag cascade preserves stack order

- **WHEN** siblings are stacked `A` above `B` above `C` and dragging (or growing via drag-driven parent resize) causes `A` to overlap `B` without enough free space before `C`
- **THEN** `B` moves just below `A` and `C` moves just below `B`; `B` MUST NOT jump below `C` in a single non-cascading placement

#### Scenario: Drag left grows the folder group

- **WHEN** the user drags a child left so its parent-relative `x` would sit left of the group's content origin while other siblings remain further right
- **THEN** after reflow the children's relative order is preserved, the minimum child `x` meets the content origin, the folder group's width has grown to fit the span, and the group's position in its parent has moved left so the dragged child's world position matches the pointer (no stuck clamp at the previous left edge)

#### Scenario: Drag up clears the header and grows the folder group

- **WHEN** the user drags a child upward into or above the folder group header/content inset
- **THEN** after reflow the minimum child `y` meets the content origin below the header, the folder group's height has grown as needed, and the group's position in its parent has moved upward so world positions of the children are preserved

#### Scenario: Nested left growth bubbles

- **WHEN** dragging a node left expands an inner folder group into a sibling folder group at the parent level
- **THEN** the parent-level settle pushes the overlapped sibling as needed and the outer folder group compacts and resizes so the grown inner group remains inside its content origin bounds

#### Scenario: Leftmost child moving right shrinks left inset

- **WHEN** the leftmost child of a folder group is dragged right so the minimum child `x` would sit past the content origin
- **THEN** after reflow the minimum child `x` again meets the content origin, sibling relative order is preserved, the folder group's position in its parent has moved right, and the group's width reflects the compacted child span (no persistent empty strip left of the content origin)

#### Scenario: Topmost child moving down shrinks top inset

- **WHEN** the topmost child of a folder group is dragged down so the minimum child `y` would sit past the content origin
- **THEN** after reflow the minimum child `y` again meets the content origin below the header, the folder group's position in its parent has moved down, and the group's height reflects the compacted child span (no persistent empty strip between the header inset and the content)

### Requirement: Auto layout invalidates folder cache

When the user requests auto layout for a single folder, the system SHALL invalidate that folder's group cache entry and rebuild so the folder is cold-laid out. When the user requests recursive auto layout for a folder, the system SHALL invalidate that folder's entry and all descendant group entries, then rebuild.

#### Scenario: Auto layout one folder

- **WHEN** the user runs auto layout on folder F
- **THEN** only F's group cache entry is invalidated before rebuild

#### Scenario: Auto layout recursive

- **WHEN** the user runs recursive auto layout on folder F
- **THEN** F and every descendant group cache entry under F are invalidated before rebuild

### Requirement: Auto-layout-only mode ignores cache

When auto-layout-only mode is enabled, the system SHALL NOT apply the layout cache during builds and SHALL NOT persist user drag layouts into the cache for that mode.

#### Scenario: Auto-layout-only build

- **WHEN** auto-layout-only mode is on and the graph rebuilds
- **THEN** visible groups are cold-laid out without seeding from the layout cache

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

### Requirement: Edge style change does not rebuild layout

Changing the graph edge style MUST NOT trigger a graph rebuild and MUST NOT reset the live layout cache from persisted workspace layouts. Edge style is a presentation concern applied when rendering edges; node positions and group layouts MUST remain as they were (including unsaved drag updates still only in the live cache).

#### Scenario: Switch edge style keeps live layout

- **WHEN** the user has dragged nodes (positions present in the live layout cache but not yet saved to the workspace) and then changes the graph edge style
- **THEN** edge paths update to the new style and the live layout cache (and visible node positions) are unchanged; no graph build is started solely for that style change

#### Scenario: Edge style change with auto-layout-only

- **WHEN** auto-layout-only mode is on and the user changes the graph edge style
- **THEN** edge paths update to the new style and no graph build is started solely for that style change
