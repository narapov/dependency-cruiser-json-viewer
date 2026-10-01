# Proposal

## Why

Rules UI and commands rebuild the global rules catalog on every read by scanning snapshot modules (`getCruiseSources`) and regrouping `ruleSetUsed` + violations. That work duplicates what snapshot build already does for per-path `applicableRules` and for `cycles`, and the `sources` filter only exists because ignore-filtered snapshots still receive unscoped cruise-summary violations. Materializing a scoped global `rules` list on the snapshot removes the redraw cost and the workaround.

## What Changes

- Add `CruiseSnapshot.rules: RuleWithViolations[]`, computed once in `buildCruiseSnapshot` (same grouping semantics as today's `groupRulesWithViolations`, including orphan violation names).
- Scope indexed `violations` (and the inputs to `applicableRules` / `rules`) to modules present in the snapshot by filtering on violation `from` — matching current UI filter semantics.
- Switch Rules panel, rule-violations picker, `hasRuleViolations`, and `showRuleViolationsOnly` to read snapshot fields instead of regrouping with `getCruiseSources`.
- Keep `groupRulesWithViolations` as a domain helper used at build time (and tests); stop calling it from App UI with a sources list.
- Update `EMPTY_CRUISE_SNAPSHOT` and snapshot tests accordingly.

## Capabilities

### New Capabilities

- `cruise-snapshot-rules`: Global rules-with-violations catalog on the cruise snapshot, scoped to snapshot modules, consumed by rules UI and rule-violation commands.

### Modified Capabilities

- (none)

## Impact

- Domain: `CruiseSnapshot` type, `buildCruiseSnapshot`, `EMPTY_CRUISE_SNAPSHOT`.
- App consumers: `RulesPanel`, `useRuleViolationsPickerDialog`, `useAppCommands`, `useAppOrchestration.showRuleViolationsOnly`.
- No user-facing UX change intended (same rule order, severities, violation counts, ignore behavior).
- Out of scope: CircularPanel `sourceSet` cleanup; changing `filterCruiseResult` to strip summary violations; redesign of `applicableRules`.
