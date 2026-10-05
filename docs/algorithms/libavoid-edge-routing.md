# libavoid edge routing

Four steps. ELK JSON shape is only the obstacle wire format for libavoid — no ELK layout runs here. Recursion expands folders that contain endpoints; other folders stay opaque. Edges are batched for libavoid; between batches the worker yields. In-flight / drag UI uses smooth-step.

Runs in a worker when `edgesType` is `libavoidOrthogonal` via [`useLibavoidEdgeRouting`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/hooks/useLibavoidEdgeRouting/useLibavoidEdgeRouting.ts).

Implementation: [`routeEdgesWithLibavoid.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/routeEdgesWithLibavoid/routeEdgesWithLibavoid.ts), [`collectRoutingLevels.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/routeEdgesWithLibavoid/collectRoutingLevels/collectRoutingLevels.ts), [`nodesToLibavoidGraph.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/routeEdgesWithLibavoid/nodesToLibavoidGraph/nodesToLibavoidGraph.ts).

## Overview

```mermaid
flowchart LR
  Start([Start])
  S1[1. LCA + lift edges]
  S2[2. Assign ports]
  S3[3. Flat then hierarchical libavoid]
  S4[4. Overlap re-route]
  End([End])
  Start --> S1 --> S2 --> S3 --> S4 --> End
```

## Step 1 — LCA and lift edges

Input: layouted visible tree, thin edges, live geometry. Each edge is lifted to the LCA of its endpoints and assigned to that folder level (or the virtual root). Within a level: leaf↔leaf among direct children vs cross-folder.

```mermaid
flowchart TD
  Start([Start])
  In[Layouted tree + thin edges + live geometry]
  ForEdge[For each edge]
  Lca[Compute LCA of endpoints]
  Lift[Assign edge to that LCA level]
  Kind{both ends direct leaf children of LCA?}
  Leaf[Add to leaf edges]
  Cross[Add to cross-folder edges]
  Levels[Levels ready]
  End([End])

  Start --> In --> ForEdge --> Lca --> Lift --> Kind
  Kind -->|yes| Leaf --> ForEdge
  Kind -->|no| Cross --> ForEdge
  ForEdge -->|all edges done| Levels --> End
```

## Step 2 — Assign ports

Global EAST/WEST port indices for every routable edge, shared across flat, hierarchical, and overlap passes. Prefer frozen ports from `buildGraph` when every thin edge carries them; otherwise assign at route time by opposite-endpoint Y (slots top-to-bottom). Runs after levels are collected, before any libavoid call.

```mermaid
flowchart TD
  Start([Start])
  In[Thin edges + live geometry]
  TryFrozen[libavoidPortAssignmentFromEdgeData]
  AllFrozen{every edge has EAST source + WEST target port?}
  UseFrozen[Reuse frozen indices + per-node port counts]
  Centers[Absolute center Y per node]
  Outgoing[Per source: sort outgoing by target center Y]
  Incoming[Per target: sort incoming by source center Y]
  Indices[Assign EAST / WEST indices]
  Counts[Per-node eastPortCount / westPortCount]
  Ready[LibavoidPortAssignment for step 3]
  End([End])

  Start --> In --> TryFrozen --> AllFrozen
  AllFrozen -->|yes| UseFrozen --> Ready
  AllFrozen -->|no| Centers --> Outgoing --> Incoming --> Indices --> Counts --> Ready
  Ready --> End
```

## Step 3 — Flat then hierarchical libavoid

Two global passes over all LCA levels (not interleaved per level): first `routeFlatLevels` for every level’s leaf edges, then `routeHierarchicalLevels` for every level’s cross-folder edges (batched). Flat pass: opaque direct children of the LCA. Hierarchical pass: expand folders whose subtree contains an endpoint, keep others opaque; yield between batches.

```mermaid
flowchart TD
  Start([Start])
  In[Levels + ports]
  FlatPass[Pass 1: routeFlatLevels — all levels]
  NextFlat[Next LCA level with leaf edges]
  FlatBuild[Flat obstacles: direct children opaque]
  FlatRoute[libavoid route]
  MoreFlat{more flat levels?}
  HierPass[Pass 2: routeHierarchicalLevels — all levels]
  NextHier[Next LCA level with cross-folder edges]
  NextBatch[Next cross-folder batch]
  BuildObstacles[Build obstacles: expand-or-opaque under LCA]
  CrossRoute[libavoid route batch]
  Yield[Yield between batches]
  MoreBatch{more batches?}
  MoreHier{more hierarchical levels?}
  Out[Routes for step 4]
  End([End])

  Start --> In --> FlatPass --> NextFlat --> FlatBuild --> FlatRoute --> MoreFlat
  MoreFlat -->|yes| NextFlat
  MoreFlat -->|no| HierPass --> NextHier --> NextBatch --> BuildObstacles --> CrossRoute --> Yield --> MoreBatch
  MoreBatch -->|yes| NextBatch
  MoreBatch -->|no| MoreHier
  MoreHier -->|yes| NextHier
  MoreHier -->|no| Out --> End
```

## Step 4 — Overlap re-route

Detect collinear overlapping route groups, then for each group/batch reuse expand-or-opaque under the group LCA and re-route with libavoid. The main thread merges absolute routes into SVG paths (`mergeAvoidRoutes` in `useLibavoidEdgeRouting`).

```mermaid
flowchart TD
  Start([Start])
  Routes[Routes from step 3]
  Detect[Detect collinear overlapping groups]
  HasGroups{any overlap groups?}
  NextGroup[Next overlap group / batch]
  Expand[Same expand-or-opaque under group LCA]
  Reroute[libavoid re-route]
  More{more groups / batches?}
  Out[Absolute AvoidRoute per edge]
  Merge[Main thread: merge to SVG paths]
  End([End])

  Start --> Routes --> Detect --> HasGroups
  HasGroups -->|no| Out
  HasGroups -->|yes| NextGroup --> Expand --> Reroute --> More
  More -->|yes| NextGroup
  More -->|no| Out
  Out --> Merge --> End
```
