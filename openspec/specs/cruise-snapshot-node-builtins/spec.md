# cruise-snapshot-node-builtins Specification

## Purpose

Places cruise core modules under a single synthetic `:buildIn:` root in the snapshot, using bare cruise ids when protocol is unset and `protocol + id` as one flat leaf name when protocol is set, and excludes that root from default selection like `node_modules`.

## Requirements

### Requirement: Core endpoints live under :buildIn:

When building a cruise snapshot, every core-module endpoint (`coreModule: true`) MUST be indexed under the synthetic folder `:buildIn:`. The leaf name MUST be `protocol + cruiseId` when the dependency's `protocol` is set (for example `node:` + `path/posix` → leaf `node:path/posix`), and MUST be the bare cruise id when `protocol` is unset. The snapshot path MUST be `:buildIn:/` + leaf (for example `:buildIn:/node:path/posix`). The system MUST NOT invent a default protocol such as `node:` when protocol is unset. Non-core modules MUST keep their cruise source paths unchanged.

#### Scenario: Unset protocol uses bare id under :buildIn:

- **WHEN** a cruise result includes a core module or core dependency for `crypto` with no `protocol`
- **THEN** the snapshot path index contains a file node at `:buildIn:/crypto`
- **AND** that node's parent is `:buildIn:`
- **AND** `crypto` is not a top-level root in `snapshot.tree`

#### Scenario: Set protocol prefixes the leaf name

- **WHEN** a non-core module depends on resolved `path/posix` with `coreModule: true` and `protocol` `node:`
- **THEN** the snapshot edge target is `:buildIn:/node:path/posix`
- **AND** the file node's display basename is `node:path/posix`

#### Scenario: bun protocol leaf

- **WHEN** a non-core module depends on resolved `fs` with `coreModule: true` and `protocol` `bun:`
- **THEN** the snapshot edge target is `:buildIn:/bun:fs`

#### Scenario: Non-core paths unchanged

- **WHEN** a cruise result includes a module with `source` `src/a.ts` and `coreModule` false
- **THEN** that module's snapshot path remains `src/a.ts`

### Requirement: Distinct leaves for bare vs protocol-prefixed ids

When the same cruise core id appears both without protocol and with one or more protocols, the snapshot MUST contain distinct file nodes for each distinct leaf name (for example `:buildIn:/fs` and `:buildIn:/node:fs`), each sharing the same `originModule` when they refer to the same cruise module. Snapshot edges MUST use the leaf that matches that dependency's protocol presence and value.

#### Scenario: Mixed unset and node: for fs

- **WHEN** core dependencies resolve to `fs` both with unset protocol and with `protocol` `node:`
- **THEN** the snapshot contains `:buildIn:/fs` and `:buildIn:/node:fs`
- **AND** the unset-protocol edge targets `:buildIn:/fs`
- **AND** the `node:` edge targets `:buildIn:/node:fs`

### Requirement: Leaves under :buildIn: are flat

Under `:buildIn:`, a `/` inside the leaf name MUST NOT create intermediate folder nodes. For any snapshot path `:buildIn:/` + leaf, the file node's parent MUST be `:buildIn:` and its ancestors MUST be exactly `[:buildIn:]`. The display basename MUST be the full leaf string.

#### Scenario: node:path/posix is one leaf

- **WHEN** a core dependency uses protocol `node:` and resolved `path/posix`
- **THEN** the snapshot contains a file node at `:buildIn:/node:path/posix`
- **AND** its parent is `:buildIn:`
- **AND** the snapshot does not contain a folder node at `:buildIn:/node:path`

#### Scenario: Bare path/posix module is one leaf

- **WHEN** a core module has source `path/posix` and is placed with a bare leaf (no protocol)
- **THEN** the snapshot contains `:buildIn:/path/posix` with parent `:buildIn:`
- **AND** basename is `path/posix`

### Requirement: Default selection excludes :buildIn:

When computing the default selected file set for a newly loaded cruise snapshot, the system MUST NOT select file paths under `:buildIn:`. Exclusion of `node_modules` MUST remain unchanged. Users MUST still be able to select `:buildIn:` files manually after load.

#### Scenario: Built-in files omitted from default selection

- **WHEN** default selected keys are computed for a snapshot that includes `src/a.ts` and `:buildIn:/node:fs`
- **THEN** the default selection includes `src/a.ts`
- **AND** the default selection does not include `:buildIn:/node:fs`

#### Scenario: node_modules exclusion still applies

- **WHEN** default selected keys are computed for a snapshot that includes `node_modules/pkg/index.js` and `src/a.ts`
- **THEN** the default selection includes `src/a.ts`
- **AND** the default selection does not include `node_modules/pkg/index.js`
