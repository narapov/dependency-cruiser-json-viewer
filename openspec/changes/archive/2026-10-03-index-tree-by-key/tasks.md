# Tasks

## 1. Domain helper

- [x] 1.1 Add `indexTreeByKey` under `src/domain/helpers/treeUtils/` (folder + barrel export from domain helpers) with the locked signature `getKey(node, ancestors)`; verify unit tests cover nested indexing, empty roots, empty ancestors at roots, nearest→root ancestor order, shared object refs, and last-write on duplicate keys

## 2. Replace GraphCanvas duplicates

- [x] 2.1 Switch `buildGraph` and `getEdgesPorts` from local `indexLayoutedNodes` to `indexTreeByKey(..., node => node.path)`; verify buildGraph / getEdgesPorts tests still pass
- [x] 2.2 Replace `flattenThinRoutingTree` call sites with `indexTreeByKey` and delete the flatten helper folder/exports; verify libavoid / collectRoutingLevels / nodesToLibavoid tests still pass

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run format:check`, `npm run test`, `npm run build`, and `npm run depcruise`; fix regressions from this change
