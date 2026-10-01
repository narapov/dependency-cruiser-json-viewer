# cruise-snapshot-cycles Specification

## Purpose

Keeps circular-dependency cycles truthful on the cruise snapshot when ignore filtering removes members, and presents those cycles in the Circular panel without collapsing or inventing edges.

## Requirements

### Requirement: Snapshot cycles include ignored-member annotation

When a cruise snapshot is built with ignore filtering applied to modules, the system SHALL attach a `cycles` catalog collected from the unfiltered cruise result modules. Each cycle member MUST include its path and whether that path is absent from the filtered snapshot modules (`ignored`). Cycle path order MUST be preserved. Distinct cycles MUST continue to collapse rotations of the same ring to one entry.

#### Scenario: Partial ignore keeps full member list

- **WHEN** a cycle `a → b → c → d` exists in the unfiltered cruise result and ignore filtering removes only `b` from snapshot modules
- **THEN** the snapshot cycle retains members `a`, `b` (ignored), `c`, `d` in cycle order

#### Scenario: Fully ignored cycle is retained

- **WHEN** every member of a distinct cycle is absent from filtered snapshot modules
- **THEN** that cycle still appears on the snapshot with every member marked ignored

#### Scenario: No ignore patterns marks no members ignored

- **WHEN** a snapshot is built with no ignore filtering (all cruised modules present)
- **THEN** every cycle member has `ignored` false

### Requirement: Circular panel shows full cycles and groups by ignored members

The Circular panel MUST list snapshot cycles without stripping ignored members from labels or expanded lists. Cycles with no ignored members MUST appear under a Without ignored section. Cycles with both ignored and non-ignored members MUST appear under a With ignored section. Cycles with every member ignored MUST appear under a Fully ignored section. Ignored members MUST be visually marked in the cycle label and in the expanded member list.

#### Scenario: Partial ignore label stays truthful

- **WHEN** the panel shows a cycle whose members are `a`, `b` (ignored), `c`, `d`
- **THEN** the label preserves that order and marks `b` as ignored (not `a → c → d`)

#### Scenario: Sections split clean vs partially ignored cycles

- **WHEN** the snapshot has both a cycle with no ignored members and a cycle with some but not all members ignored
- **THEN** the panel lists the former under Without ignored and the latter under With ignored

#### Scenario: All-ignored cycle appears under Fully ignored

- **WHEN** a snapshot cycle has every member ignored
- **THEN** the panel lists that cycle under Fully ignored with ignored markers

### Requirement: Show cycle selects only present members

When the user chooses Show cycle for a cycle that has at least one non-ignored member, the system MUST select only the non-ignored member paths. When every member is ignored, Show cycle MUST be unavailable.

#### Scenario: Show cycle omits ignored paths

- **WHEN** the user activates Show cycle on `a → b (ignored) → c → d`
- **THEN** only `a`, `c`, and `d` are selected for the graph (ignored `b` is omitted)

#### Scenario: All-ignored disables Show cycle

- **WHEN** every member of the cycle is ignored
- **THEN** Show cycle cannot be activated for that cycle
