# Spec Delta

## MODIFIED Requirements

### Requirement: Drag updates cache without rebuild

While the user drags a node (and auto-layout-only mode is off), the system SHALL update live custom-positioned geometry using the same cascading top-down vertical settle as the build path, except the dragged node MUST remain fixed at the drag position (it is not pushed). Overlaps among siblings MUST cascade (`A` pushes `B`, `B` pushes `C`) rather than teleporting an overlapped sibling below an unrelated lower sibling. Ancestor group bounds MUST grow as needed. Durable layout cache entries MUST be updated from that settled geometry when the drag finishes (commit), not on every intermediate drag move. The system MUST NOT trigger a graph rebuild solely because of the drag.

#### Scenario: Drag does not rebuild

- **WHEN** the user finishes dragging a node
- **THEN** the node's (and affected siblings'/ancestors') geometry is reflected in the layout cache and no graph build is started for that drag

#### Scenario: Overlap pushes siblings down

- **WHEN** a dragged node overlaps a sibling
- **THEN** that sibling is moved downward until the overlap is cleared, and ancestor groups grow if children exceed their bounds

#### Scenario: Drag cascade preserves stack order

- **WHEN** siblings are stacked `A` above `B` above `C` and dragging (or growing via drag-driven parent resize) causes `A` to overlap `B` without enough free space before `C`
- **THEN** `B` moves just below `A` and `C` moves just below `B`; `B` MUST NOT jump below `C` in a single non-cascading placement

#### Scenario: Intermediate drag moves do not rewrite durable cache

- **WHEN** the user is mid-drag and live geometry has already settled overlapping siblings
- **THEN** durable layout cache entries remain as they were at drag start until the drag finishes and commits
