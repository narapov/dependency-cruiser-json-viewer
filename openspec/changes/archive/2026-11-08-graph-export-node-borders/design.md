# Design

## Context

See proposal.md — Why. Today:

- DOT leaves: `style=filled`, `fillcolor`, `color=<border>` — no `penwidth`
- DOT clusters: `color=<border>` — no `penwidth`
- Mermaid leaves/subgraphs: `fill:…,stroke:…,color:…` via `style` / file `classDef` — no `stroke-width`
- Edges in both formats already set width explicitly

Shared colors live in `helpers/toExportColor/` (`DEFAULT_EXPORT_NODE_BORDER`, `resolveExportFileNodeColors`, etc.).

## Goals / Non-Goals

**Goals:**

- One shared numeric border width for export nodes/clusters, applied as DOT `penwidth` and Mermaid `stroke-width`.
- Cover file leaves, folder leaves, and folder groups/clusters.
- Keep border colors as they are.

**Non-Goals:**

- Changing edge widths or highlight thickness.
- Matching canvas folder-group `border: 2` separately from file `border: 1` (single export width).
- Theme-aware divider colors; keep hex constants.
- New export commands or viewers.

## Decisions

### 1. Shared constant next to border color

Add `DEFAULT_EXPORT_NODE_BORDER_WIDTH = 1` (DOT points / Mermaid `1px`) in `toExportColor` next to `DEFAULT_EXPORT_NODE_BORDER`.

**Why:** Single source of truth; Mermaid already claims DOT color parity — width should not drift.  
**Alternative:** Hardcode `1` / `1px` in each serializer — rejected (easy to diverge).  
**Alternative:** Width `2` to match folder groups on canvas — rejected for now; files dominate exports and canvas files use `1`.

### 2. DOT: add `penwidth` on leaves and clusters

In `emitLeafNode` and `emitCluster`, emit `penwidth=<DEFAULT_EXPORT_NODE_BORDER_WIDTH>` alongside existing `color`.

**Why:** Graphviz default is `1.0`, but explicit width matches Mermaid and survives hosts that treat unset pen differently from edges that do set it.  
**Alternative:** Only Mermaid — rejected; user reported both formats.

### 3. Mermaid: extend `styleFillStroke` (and file classDefs)

Include `stroke-width:${DEFAULT_EXPORT_NODE_BORDER_WIDTH}px` wherever node/subgraph fill+stroke is built (`styleFillStroke` used for folders/subgraphs and file `classDef`).

**Why:** Mermaid docs always pair `stroke` with `stroke-width`; edges already do this. One helper keeps folder `style` and file `classDef` consistent.  
**Alternative:** Only file classDefs — rejected; folders/subgraphs would still look borderless.

## Risks / Trade-offs

- **[Trade-off] Folder groups thinner than canvas (`1` vs `2`)** → Accept for export simplicity; can raise constant later if needed.
- **[Risk] Mermaid hosts ignore subgraph `stroke-width`** → Leaf borders still improve; subgraph frame remains best-effort (same as today’s stroke color).
- **[Risk] Tests assert exact style strings** → Update DOT/Mermaid unit expectations for the new attributes.

## Migration Plan

- Additive string attrs in exported files; no workspace schema change.
- Rollback: remove penwidth / stroke-width emissions and the constant.

## Open Questions

- None (width `1` recorded as explore assumption in proposal).
