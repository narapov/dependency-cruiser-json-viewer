# Proposal

## Why

Dragging a node left or up inside a folder group currently hits a dead end: children were clamped by React Flow `extent: 'parent'`, and drag reflow only grew ancestors from the right/bottom child bounds. Users cannot meaningfully rearrange content toward the left or top of a group—the node sticks at the origin and the group does not expand that way. The reverse is also wrong: when the leftmost child moves right or the topmost child moves down, empty inset remains and the folder does not hug its content origin. A prior content-origin compact path existed and was dropped; we need bidirectional left/top compact (grow and shrink) as a first-class part of live drag reflow.

## What Changes

- Stop constraining child nodes with React Flow `extent: 'parent'` so parent-relative positions may be negative during drag (signal that content overflowed left/top).
- Extend drag reflow so that after sibling settle, each affected folder group is **compacted to its content origin** (`GROUP_PADDING` on x, `GROUP_HEADER + GROUP_PADDING` on y) with a **world-preserving** signed shift: `S = origin - min(children)`; all direct children move by `S`, the group moves by `-S` in its parent (so overflow left/up grows the group that way, and excess left/top inset shrinks it back), then width/height are resolved from the new bounds (plus padding).
- Apply that compact deepest-first on ancestor folder groups as the existing bubble walks upward (recursive compact).
- Keep the existing cascading top-down vertical settle; do not add a separate right/bottom “pull content to the edge” pass—right/bottom size still comes from `resolveGroupSize` over max bounds only.
- Persist updated child positions, group position, and group size into the layout cache on the existing drag/cache path.

## Capabilities

### New Capabilities

<!-- none — behavior extends the existing layout-cache / drag reflow capability -->

### Modified Capabilities

- `graph-layout-cache`: Drag reflow must keep each affected folder group's minimum child position on the content origin via world-preserving compact (grow when children cross left/top; shrink left/top inset when the leftmost/topmost child moves inward); child nodes MUST NOT be clamped to parent bounds by React Flow `extent: 'parent'`.

## Impact

- `toReactFlowGraph` / RF node creation: remove `extent: 'parent'` on nested nodes.
- `customPositionedGraph` drag path: `reflowDragPushDown`, `normalizeGroupContentOrigin` (signed shift), tests; cache write already covers ancestor groups if positions/sizes update.
- `graph-layout-cache` spec requirement “Drag updates cache without rebuild” gains left/up grow and leftmost/topmost shrink scenarios.
- Build/ELK cold layout unchanged; no workspace schema change.
