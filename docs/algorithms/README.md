# Dependency graph algorithms

Detailed flowcharts for layout and edge routing. For workers, pipeline orchestration, and project-wide conventions see [architecture.md](../architecture.md).

| Algorithm                 | Doc                                                  | Implementation                                                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **buildGraph**            | [build-graph.md](build-graph.md)                     | [`buildGraph.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/buildGraph/buildGraph.ts), [`layoutGroup.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/buildGraph/layoutGroup/layoutGroup.ts) |
| **libavoid edge routing** | [libavoid-edge-routing.md](libavoid-edge-routing.md) | [`routeEdgesWithLibavoid.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/routeEdgesWithLibavoid/routeEdgesWithLibavoid.ts)                                                                                            |
