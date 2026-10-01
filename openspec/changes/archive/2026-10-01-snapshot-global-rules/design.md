# Design

## Context

See proposal.md — Why. Today `groupRulesWithViolations(ruleSet, violations, getCruiseSources(snapshot))` runs in Rules panel, rule-violations picker, and `hasRuleViolations`. `showRuleViolationsOnly` still reads `cruiseResult.summary.violations` plus sources. Snapshot already materializes `cycles` and per-node `applicableRules`; global rules are the missing peer field. `buildFilteredCruiseSnapshot` passes filtered modules but unscoped `summary.violations`.

## Goals / Non-Goals

**Goals:**

- Single build-time source of truth for the global rules catalog on `CruiseSnapshot`.
- Scope violation index + rules (+ applicableRules inputs) to snapshot modules by `from`.
- App consumers read `snapshot.rules` / scoped `snapshot.violations` only.

**Non-Goals:**

- Changing Rules panel UX, filter behavior, or `RuleWithViolations` shape.
- Redesigning path-scoped `applicableRules` / `isRuleApplicableToPath`.
- Stripping violations inside `filterCruiseResult` (optional later hygiene).
- CircularPanel `sourceSet` cleanup.

## Decisions

### 1. Field name: `rules`

Add `rules: RuleWithViolations[]` next to `cycles` for parallel naming.

**Alternative:** `rulesWithViolations` — more explicit, noisier at call sites. Rejected.

### 2. Scope inside `buildCruiseSnapshot`, not only in filter

```
modules + ruleSet + violationsIn
        |
        v
moduleSet = Set(module.source)
scoped = flatten(violationsIn).filter(v => moduleSet.has(v.from))
rules = groupRulesWithViolations(ruleSet, scoped)  // no sources arg
violations = indexByDepKey(scoped)
tree/applicableRules use scoped
```

**Why:** One invariant — snapshot always agrees with its modules — even if callers pass unscoped summary violations (current `buildFilteredCruiseSnapshot`).

**Alternative:** Fix only `filterCruiseResult` / the call site to pass filtered violations. Incomplete alone: other callers of `buildCruiseSnapshot` could still pass unscoped lists; UI would still regroup.

**Filter parity:** Keep `from`-only membership (same as today's sources filter). Do not also require `to` in `moduleSet`.

### 3. Keep `groupRulesWithViolations` as the build helper

Reuse the existing helper for catalog construction (named order + orphans). Remove App call sites that pass `getCruiseSources`. The optional `sources` parameter may remain for unit tests / low-level use; build path should not need it after scoping.

**Alternative:** Inline regroup only in build and delete the helper. Rejected — loses focused unit tests and reuse.

### 4. Consumer migration

| Consumer                             | After                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `RulesPanel`                         | `cruiseSnapshot.rules`                                                           |
| `useRuleViolationsPickerDialog`      | filter `rules` where `violations.length > 0`                                     |
| `useAppCommands` `hasRuleViolations` | `rules.some(...)`                                                                |
| `showRuleViolationsOnly`             | `collectViolationModulePaths(cruiseSnapshot.violations, ruleNames)` (no sources) |
| `EMPTY_CRUISE_SNAPSHOT`              | `rules: []`                                                                      |

`applicableRules` stays on nodes; Rules panel must not union those lists.

### 5. Tests focus

- `buildCruiseSnapshot`: `rules` contents; unscoped input violations drop when `from` missing from modules; empty modules → `rules: []`.
- Consumer tests: assert they read snapshot rules (behavior parity with prior regroup).
- Update any fixture/cast that constructs partial `CruiseSnapshot` objects to include `rules`.

## Risks / Trade-offs

- **[Risk] Slightly larger snapshot object** → Mitigation: one array of rule entries; built once per load/ignore change, same cadence as today.
- **[Risk] Missed cast sites for `CruiseSnapshot`** → Mitigation: TypeScript will fail empty/`as CruiseSnapshot` shapes; grep tests for partial snapshots.
- **[Risk] Behavior drift if grouping logic forks** → Mitigation: build calls the same `groupRulesWithViolations` helper; keep its tests.

## Migration Plan

Pure in-app change; no persisted workspace schema. Deploy = ship the build. Rollback = revert the change. Ignore patterns continue to rebuild the snapshot, refreshing `rules` automatically.

## Open Questions

None — field name, scoping rule, and CircularPanel exclusion were fixed in exploration.
