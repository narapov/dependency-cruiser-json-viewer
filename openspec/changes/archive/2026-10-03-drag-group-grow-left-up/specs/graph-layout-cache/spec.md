# Spec Delta

## MODIFIED Requirements

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
