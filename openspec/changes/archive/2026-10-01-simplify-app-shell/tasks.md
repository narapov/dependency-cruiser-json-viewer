# Tasks

## 1. Dialogs slot hook

- [x] 1.1 Add `useAppDialogs` (`.tsx`) that owns theme/language/ignore/about/cruise-result-json/rule-violations/highlight open state and returns command openers plus a `dialogs` ReactNode mounting the existing dialog partials; verify a focused hook test covers open → render open dialog → close (at least one dialog path)
- [x] 1.2 Export `useAppDialogs` from `src/App/hooks/index.ts` and verify the barrel typechecks via `npm run build` or importing from `@/App` hooks path used by App

## 2. File loading and watch notice slots

- [x] 2.1 Add `useAppFileLoading` (`.tsx`) composing existing cruise/settings/CLI load + drop hooks, merging errors/clears, exposing `openLoadCruiseResult` / `openLoadSettings` / `isFileLoading` / `fileLoadError` (and drop flags needed by bootstrap) plus an `overlay` ReactNode (file inputs, loading spinner, drop overlay, error snackbar); verify hook tests cover merged error preference and clear-all behavior
- [x] 2.2 Add `useCruiseResultUpdatedNotice` (`.tsx`) for watch-mode updated snackbar state/effect returning `notice`; verify a hook test skips the initial data emission and opens on a subsequent `data` change when watch is enabled
- [x] 2.3 Export both hooks from `src/App/hooks/index.ts` and verify imports resolve

## 3. AppBootstrap partial

- [x] 3.1 Add `src/App/partials/AppBootstrap/` that renders the current pending / hydrating / error / empty-load full-screen UI (spinner, alerts, load button, cruise file input, drop overlay hooks-up) from props driven by cruise query + file-loading API; verify a component test (or equivalent) covers the empty-state load button path when watch is off
- [x] 3.2 Export `AppBootstrap` via its `index.ts` following App partial conventions and verify App can import it from `./partials/AppBootstrap`

## 4. Wire thin App composer

- [x] 4.1 Refactor `App.tsx` to use `useAppDialogs`, `useAppFileLoading`, `useCruiseResultUpdatedNotice`, and `AppBootstrap`; mount `{dialogs}`, `{notice}`, `{overlay}`, and `moduleJsonDialog` inside `AppLayout` overlay with `QuickPick`; remove inlined dialog/file-load/snackbar/gate JSX; verify `App.tsx` no longer declares the seven dialog booleans or the cruise-updated snackbar effect
- [x] 4.2 Wire `useAppCommands` to the new dialog/file-loading openers and flags without changing command ids/behavior; verify `useAppCommands` tests still pass
- [x] 4.3 Run `npm run lint`, `npm run format:check`, and `npm run test`; fix any regressions introduced by the move
- [x] 4.4 Run `npm run build` and verify production typecheck/build succeeds

## 5. Colocate dialog openers in partials

- [x] 5.1 Add meaning-named opener hooks under `ThemePickerDialog`, `LanguagePickerDialog`, and `AboutDialog` (controlled UI unchanged); export each from the partial `index.ts`; verify a focused test open → dialog visible → close for at least one of them
- [x] 5.2 Add opener hooks for `IgnorePatternsDialog`, `RuleViolationsPickerDialog`, and `HighlightEdgeDialog` with their data/callback props; export from barrels; verify at least one opener test covers open/close
- [x] 5.3 Add `useJsonDialog` beside `JsonViewDialog`, export it from that partial’s barrel, and migrate cruise-result JSON plus module JSON onto it (thin path-resolve wrapper allowed); verify two call sites work and remove any empty cruise-result placeholder needed only for the old bag
- [x] 5.4 Rewire `App.tsx` to compose the individual opener hooks and mount their dialog nodes; delete `useAppDialogs` (hook, tests, barrel export); verify `App` no longer imports `useAppDialogs`
- [x] 5.5 Update `App.test.tsx` / related mocks for the new imports; run `npm run lint`, `npm run format:check`, `npm run test`, and `npm run build` and fix regressions

## 6. Split AppBootstrap into cruise-result screens

- [x] 6.1 Add `CruiseResultLoading` partial (centered spinner + drop overlay props); export via `index.ts`; verify a component test renders the progress indicator
- [x] 6.2 Add `CruiseResultEmptyState` partial (parse-error vs missing-result alerts, load button/file input when watch is off, fileLoadError, drop overlay); migrate/adapt tests from `AppBootstrap` empty-state cases; verify load-button path when watch is off
- [x] 6.3 Rewire `App.tsx` to early-return `CruiseResultLoading` vs `CruiseResultEmptyState`; delete `AppBootstrap`; verify `App` no longer imports `AppBootstrap`
- [x] 6.4 Run `npm run lint`, `npm run format:check`, `npm run test`, `npm run depcruise`, and `npm run build`; fix regressions

## 7. AppHeader reads store / env

- [x] 7.1 Move module counts, ignored badge, and watch-mode derivation into `AppHeader` (store + domain helpers + `getWindowEnvs`); remove those props from `AppHeaderProps` and from `App.tsx`; verify Header tests (or new ones) seed workspace store and assert counts/badge/watch without parent-passed count props
- [x] 7.2 Keep Header action callbacks as props; verify `App` still wires search/palette/ignore/about openers and existing Header interaction coverage still passes

## 8. AppLayout reads panel open flags

- [x] 8.1 Read `dependenciesPanelOpen` / `applicableRulesPanelOpen` from `useWorkspaceStore` inside `AppLayout` (or a colocated layout hook); remove those two props from `AppLayoutProps` and `App.tsx`; verify layout/panel tests cover open vs closed panels via store state

## 9. Self-sufficient dialog openers for store data

- [x] 9.1 Update `useIgnorePatternsDialog` to read `ignorePatterns` / `setIgnorePatterns` from the workspace store; call with no patterns/onSave from App; verify opener or dialog tests still open/save/close correctly against the store
- [x] 9.2 Update `useRuleViolationsPickerDialog` to derive rule options from store snapshot + domain helpers; keep `onConfirm` from App; verify picker still lists violations and confirm still invokes orch wiring
- [x] 9.3 Update cruise `useJsonDialog` / `useModuleJsonDialog` to read cruise result / modules from the store instead of App-passed data; verify both open paths still show the expected JSON
- [x] 9.4 Source `hasCruiseResult` / `hasRuleViolations` / `cruiseWatchEnabled` for `useAppCommands` without reintroducing Header/Layout display prop plumbing (prefer inside commands or minimal App flags); verify command enablement still matches prior behavior

## 10. Thin App and verify

- [x] 10.1 Remove unused store selectors and domain count/rules derivation from `App.tsx` that only fed Header/Layout/opener props; verify App no longer computes `totalModulesCount` / `filteredModulesCount` / `ignoredModuleCount` for Header
- [x] 10.2 Update `App.test.tsx` mocks/assertions for thinner Header/Layout/opener APIs; run `npm run lint`, `npm run format:check`, `npm run test`, `npm run depcruise`, and `npm run build`; fix regressions

## 11. HighlightEdge target step via allowedPaths (+ ancestors)

- [x] 11.1 Change `HighlightEdgeDialogContent` to read `cruiseSnapshot` from the workspace store; compute `targetSources` via existing domain helpers; build `allowedPaths` as related sources union their ancestor folder paths (snapshot `ancestors` / `getAncestorKeys`); verify a focused test covers related file + at least one ancestor in the searchable set
- [x] 11.2 Wire target step to `<PathSearchBody allowedPaths={...} />` and remove nested `buildCruiseSnapshot` + `CruiseSnapshotProvider` from HighlightEdge; verify source step stays unrestricted and highlight confirm still works

## 12. Replace CruiseSnapshotContext with store

- [x] 12.1 Migrate production consumers of `useCruiseSnapshot` / `useCruiseSnapshotRequired` (`DependencyPanel`, `RulesPanel`, `CircularPanel`, `ApplicableRulesPanel`, `QuickPick` / `usePathSearchState`, etc.) to `useWorkspaceStore` snapshot reads; verify each still renders with store-seeded data
- [x] 12.2 Update tests that wrap `CruiseSnapshotProvider` to seed the workspace store instead; verify those suites pass without the provider
- [x] 12.3 Remove `CruiseSnapshotProvider` from `App.tsx`; delete `src/App/contexts/CruiseSnapshotContext/` and barrel exports; verify repo has no remaining imports of the context APIs
- [x] 12.4 Run `npm run lint`, `npm run format:check`, `npm run test`, `npm run depcruise`, and `npm run build`; fix regressions
