# Tasks

## 1. Shared constant and SmoothStep path

- [x] 1.1 Export `ORTHOGONAL_CORNER_RADIUS = 3` from `avoidRouteToPath` (alongside `CROSSING_JUMP_RADIUS`) and re-export via its barrel; verify the constant is imported from that module in a unit test or by asserting `ORTHOGONAL_CORNER_RADIUS === 3` in an existing test file
- [x] 1.2 Pass `borderRadius: ORTHOGONAL_CORNER_RADIUS` into `getSmoothStepPath` from `getDependencyEdgePath` for `simpleOrthogonal` and `libavoidOrthogonal`; update `getDependencyEdgePath.test.ts` so mocked `getSmoothStepPath` is called with `borderRadius: 3`, then run that test file

## 2. Libavoid path fillets

- [x] 2.1 Fillet axis-aligned bends in `avoidRouteToPath` with SmoothStep-style quadratic corners (`bendSize = min(prevLen/2, nextLen/2, ORTHOGONAL_CORNER_RADIUS)`), leave collinear triples as plain `L`, and keep hop arcs at `CROSSING_JUMP_RADIUS`; update `avoidRouteToPath.test.ts` for rounded bends, short-segment clamp, collinear pass-through, and hops still at radius 1.5, then run that test file
- [x] 2.2 Update `mergeAvoidRoutes` expectations if golden path strings assume sharp polylines; run `mergeAvoidRoutes.test.ts` and confirm hop-containing paths still include `A` with radius 1.5 while bends include `Q`

## 3. Verification

- [x] 3.1 Run targeted Vitest for `avoidRouteToPath`, `getDependencyEdgePath`, and `mergeAvoidRoutes`, then `npm run lint` and `npm run format:check` on touched files
