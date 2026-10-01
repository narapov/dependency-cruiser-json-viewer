# Tasks

## 1. Snapshot model and build

- [x] 1.1 Add `rules: RuleWithViolations[]` to `CruiseSnapshot` and `rules: []` to `EMPTY_CRUISE_SNAPSHOT`; verify TypeScript fails any incomplete snapshot literals until they include `rules`
- [x] 1.2 In `buildCruiseSnapshot`, scope flattened violations to module `from` paths, index that set, build `applicableRules` from it, and set `rules` via `groupRulesWithViolations(ruleSet, scoped)`; verify `buildCruiseSnapshot` tests cover named rules with violations, empty-violation rules, orphans, empty modules → `rules: []`, and exclusion of out-of-module `from` violations from both `rules` and the violation index

## 2. App consumers

- [x] 2.1 Switch `RulesPanel` to `cruiseSnapshot.rules` (drop `groupRulesWithViolations` / `getCruiseSources`); verify `RulesPanel` tests still pass for list/filter behavior
- [x] 2.2 Switch `useRuleViolationsPickerDialog` and `useAppCommands` `hasRuleViolations` to snapshot `rules`; verify their tests pass and neither imports `groupRulesWithViolations` for this purpose
- [x] 2.3 Switch `showRuleViolationsOnly` to `collectViolationModulePaths(cruiseSnapshot.violations, ruleNames)` without sources / cruise-summary violations; verify orchestration tests for show-rule-violations still pass

## 3. Fixtures and verification

- [x] 3.1 Update remaining test fixtures / `as CruiseSnapshot` casts to include `rules` (grep for partial snapshots); verify `npm run test` and `npm run build` succeed for the touched surface
