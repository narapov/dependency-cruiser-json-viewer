# Spec Delta

## Purpose

Maintains a global rules-with-violations catalog on the cruise snapshot so rules UI and commands read precomputed, module-scoped rule data instead of regrouping raw rule sets and violations on each use.

## ADDED Requirements

### Requirement: Snapshot exposes global rules catalog

When a cruise snapshot is built from modules, a rule set, and violations, the system SHALL attach a global `rules` catalog. Each entry MUST include the rule name, severity, the rule definition when known (or null for orphan names), and the list of violations for that rule. Named rules from the rule set MUST appear in forbidden → allowed → required order. Violation names not present in the rule set MUST appear afterward as orphan entries, sorted by name. An empty module list MUST yield an empty `rules` catalog.

#### Scenario: Named rules with matching violations

- **WHEN** a snapshot is built with a named forbidden rule and one or more violations for that rule whose `from` is among the snapshot modules
- **THEN** the snapshot `rules` catalog contains that rule with those violations attached

#### Scenario: Rules without violations are listed

- **WHEN** a snapshot is built with a named rule that has no matching violations among snapshot modules
- **THEN** the snapshot `rules` catalog still includes that rule with an empty violations list

#### Scenario: Orphan violation names

- **WHEN** violations reference a rule name that is not in the rule set, and those violations' `from` paths are among the snapshot modules
- **THEN** the snapshot `rules` catalog includes an orphan entry for that name after the named rules

#### Scenario: Empty modules

- **WHEN** a snapshot is built with no modules
- **THEN** the snapshot `rules` catalog is empty

### Requirement: Snapshot violations and rules are scoped to snapshot modules

When building a cruise snapshot, the system SHALL retain only violations whose `from` path is a module in that snapshot. The dependency-key violation index and the global `rules` catalog MUST use that same scoped violation set. Violations whose `from` is not among snapshot modules MUST NOT appear in the index or in any `rules` entry's violations list.

#### Scenario: Ignored module violations excluded

- **WHEN** the input violation list includes a violation whose `from` is not among the snapshot modules (for example after ignore filtering removed that module)
- **THEN** that violation is absent from the snapshot violation index and from every `rules` entry

#### Scenario: Same scoping feeds applicable rules

- **WHEN** a snapshot is built with unscoped input violations and a subset of modules
- **THEN** per-path applicable-rule violation lists also exclude violations whose `from` is outside the snapshot modules

### Requirement: Rules UI and commands consume snapshot rules

The Rules panel, the rule-violations picker, and the command that enables "show rule violations" MUST derive their rule lists and "has violations" checks from the ambient cruise snapshot's `rules` catalog. Showing only modules involved in selected rule violations MUST use the snapshot's scoped violation data (not the unfiltered cruise-result summary violations paired with a live sources scan).

#### Scenario: Rules panel lists snapshot rules

- **WHEN** a cruise result is loaded and the Rules panel is shown
- **THEN** the panel lists the same rules and violation counts as the snapshot `rules` catalog (subject only to the panel's name filter)

#### Scenario: Picker and command use snapshot rules

- **WHEN** the user opens the rule-violations picker or the app evaluates whether any rule has violations
- **THEN** those flows use the snapshot `rules` catalog without regrouping from `ruleSetUsed` plus a sources list

#### Scenario: Show rule violations uses scoped snapshot data

- **WHEN** the user confirms one or more rule names to show only their violation modules
- **THEN** the selected paths come from violations retained on the snapshot for those rules, not from unscoped cruise-summary violations filtered by a fresh sources scan
