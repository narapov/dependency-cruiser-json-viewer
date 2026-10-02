# Design

## Context

See proposal.md — Why. Live drag already runs `applyPositions` → `reflowDragPushDown` (sibling settle + content-origin normalize + `resolveGroupSize` on ancestors) and writes the layout cache. Nested RF nodes no longer use `extent: 'parent'`. The first normalize implementation used `Math.max(0, origin - min)`, so only left/up _growth_ worked; excess left/top inset when the leftmost/topmost child moves inward was left as a non-goal and is now in scope.

## Goals / Non-Goals

**Goals:**

- Allow negative (and sub-origin) parent-relative positions during drag by not using RF parent extent clamping.
- After settle, world-preserving **signed** compact each affected folder group so `min` child position equals the build content origin (both when `min < origin` and when `min > origin` on x/y), then resize from bounds.
- Keep existing vertical overlap settle and ancestor bubble loop (compact runs deepest-first on ancestors → recursive).
- Cover with unit tests on the layouted-node reflow helpers; keep RF bridge thin.

**Non-Goals:**

- Adopting RF `expandParent` as the growth mechanism.
- Changing ELK cold layout or workspace schema.
- Horizontal overlap push (still y-only settle).
- A dedicated pass that pulls content to the **right/bottom** edge of the group. Right/bottom size continues to follow max child bounds via `resolveGroupSize` only (empty space on the right/bottom after moving a non-extreme child may remain until auto-layout).

## Decisions

### 1. No `extent: 'parent'` on nested nodes

- **Choice:** Omit `extent` (or set undefined) in `toReactFlowGraph` for nodes with a parent.
- **Why:** Negative / sub-origin coordinates are the overflow signal; clamping fights normalize.
- **Alternatives:** Custom coordinate extent inset by padding — still a hard wall without growth. RF `expandParent` — dual ownership with our cache/reflow (rejected).

### 2. World-preserving signed compact to content origin

- **Choice:** For folder group `G` with direct children `C`, content origin `(ox, oy) = (GROUP_PADDING, GROUP_HEADER + GROUP_PADDING)`:

  ```
  minX, minY = mins over C positions
  Sx = ox - minX; Sy = oy - minY   # signed: grow when min < origin, shrink inset when min > origin
  if Sx != 0 or Sy != 0:
    each child.position += (Sx, Sy)
    G.position -= (Sx, Sy)
  then resolve width/height from children bounds + padding
  ```

- **Why:** Same helper covers left/up grow and leftmost/topmost inward shrink; world positions (including the dragged node under the pointer) stay stable. Matches old `compactAfterDrag` geometry with live group translation.
- **Alternatives:** `Math.max(0, origin - min)` only (current code) — leaves empty left/top inset. Children-only shift without moving `G` — sticky feel, not true left/top resize.

### 3. Order inside each bubble level: settle → compact → resize

- **Choice:** Keep `pushOverlappingSiblingsDown`, then compact the ancestor folder groups deepest-first, then `resolveGroupSize` on each.
- **Why:** Settle in drag coordinates first; then hug content origin; then derive size. Bubbling `currentId = groupId` settles the moved/resized group against its siblings, then outer compact runs.
- **Alternatives:** Compact before settle — uniform shift preserves relative overlaps, but drag-frame reasoning is harder.

### 4. Where the helper lives

- **Choice:** Keep `normalizeGroupContentOrigin` under `helpers/customPositionedGraph/`; change its shift to signed (drop `Math.max(0, …)`). Optionally rename later; not required for behavior.
- **Why:** Already wired into `reflowDragPushDown`; minimal delta.
- **Alternatives:** New `compactGroupContentOrigin` name — clarity vs churn; defer unless we want the rename in the same pass.

### 5. Root viewport group (`groupId === null`)

- **Choice:** Do not compact the synthetic root as a folder with header; only expanded folder-group nodes get content-origin compact. Root-level nodes may keep coordinates away from a folder origin.
- **Why:** Root has no folder header chrome.

## Risks / Trade-offs

- **[Risk] RF parent move + child shift in one frame races pointer math** → Mitigation: apply parent and all children position changes together via existing `layoutedMapToNodeChanges` / `onNodesChange` batch; dragged node is included in the uniform child shift so world position stays under the cursor.
- **[Risk] Nested bubble causes large sibling cascades** → Mitigation: same settle already used when groups grow; keep/extend tests for left growth and add leftmost/topmost shrink cases.
- **[Trade-off] Live compact every drag frame** → Cheap vs settle; accepted for UX (no sticky empty header/left pad mid-drag).
- **[Trade-off] Right/bottom empty space not hugged** → Explicit non-goal; max-bounds resize only.

## Migration Plan

- No data migration. Existing caches remain valid; next drag that changes min child position rewrites affected entries.
- Rollback: restore one-way `Math.max(0, …)` normalize (or `extent: 'parent'` + no normalize) if needed.
