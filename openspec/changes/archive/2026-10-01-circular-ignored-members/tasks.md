# Tasks

## 1. Domain cycle model

- [x] 1.1 Change `DistinctCycle` to `members: { path, ignored }[]` and update `collectDistinctCycles` (+ tests) so members can be annotated against a present-sources set; verify unit tests cover partial ignore, all ignored, and no-ignore cases
- [x] 1.2 Add a domain entry that builds a snapshot from `cruiseResult` + ignore patterns (filter modules, collect cycles from unfiltered modules, annotate, attach to snapshot); keep module-only `buildCruiseSnapshot` for tests; verify domain tests for partial + fully ignored cycles retained under ignore patterns

## 2. Store wiring and remove App glue

- [x] 2.1 Point `workspaceStore` at the domain result+ignore entry, replace `filteredCruiseResult.modules` with `getCruiseModules(snapshot)` where needed, and delete `buildFilteredCruiseSnapshot` (folder + barrel exports); verify store / workspace tests still pass for load, soft reset, and `setIgnorePatterns`

## 3. Circular panel UI

- [x] 3.1 Update `CircularPanel` / `CircularList` / `CircularListItem` to consume `members` (no path stripping), group into Without ignored / With ignored sections (Rules-section pattern), and mark ignored members in label and expanded list; add i18n keys in all five locales; verify panel tests for label truthfulness and section placement
- [x] 3.2 Make Show cycle pass only non-ignored paths and disable when every member is ignored; verify panel tests for both cases

## 4. Cleanup

- [x] 4.1 Remove obsolete `getCruiseSources` strip/map from `CircularPanel`, drop any dual `paths` adapters or unused annotate/collect helpers left by the refactor, and rewrite the old "hides all-outside cycles as empty" test; verify `npm run test` for affected suites and that `buildFilteredCruiseSnapshot` has no remaining references

## 5. Verification

- [x] 5.1 Run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build`; confirm all pass

## 6. Fully ignored section

- [x] 6.1 Split Circular panel grouping into Without ignored / With ignored (partial) / Fully ignored; add `circular.fullyIgnored` in all five locales; verify panel tests place all-ignored cycles under Fully ignored and partial under With ignored
- [x] 6.2 Re-run `npm run lint`, `npm run format:check`, and `npm run test` for the panel/i18n changes; confirm all pass
