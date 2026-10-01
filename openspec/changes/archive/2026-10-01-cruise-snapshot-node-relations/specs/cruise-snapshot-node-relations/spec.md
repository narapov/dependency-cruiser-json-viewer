# Spec Delta

## Purpose

Derives path-node relations, related sources, and dependency keys between paths from cruise-snapshot edge indexes so UI and commands read leave/enter edges without walking raw module arrays or graph collapse state.

## ADDED Requirements

### Requirement: Path relations come from snapshot leave/enter edges

For any path present in the cruise snapshot (file or folder), the system SHALL derive that path's dependencies and dependents from the path node's leave/enter edge indexes (`externalDependencies` / `externalDependents`). File and folder paths MUST use the same derivation rule. Relations MUST NOT use graph expand/collapse state. Internal (within-subtree) edges MUST NOT appear as that path's panel relations.

#### Scenario: File dependencies and dependents

- **WHEN** relations are requested for a file path that exists in the snapshot
- **THEN** outgoing relations are the targets of that node's leave edges and incoming relations are the sources of that node's enter edges

#### Scenario: Folder dependencies and dependents

- **WHEN** relations are requested for a folder path that exists in the snapshot
- **THEN** outgoing relations are the outside targets of that folder's leave edges and incoming relations are the outside sources of that folder's enter edges

#### Scenario: Collapse does not change folder relations

- **WHEN** relations are requested for the same folder path with different graph expand/collapse states
- **THEN** the visible and hidden relation sets are identical

#### Scenario: Unknown path yields empty relations

- **WHEN** relations are requested for a path absent from the snapshot
- **THEN** dependencies, dependents, and hidden lists are all empty

### Requirement: Relations split selected versus hidden endpoints

Given a membership set of selected file paths, the system SHALL place a relation endpoint in the visible list when that endpoint file is selected, and in the corresponding hidden list when it is not. Selection membership MUST be evaluated on file paths (the edge endpoints), not on folder collapse representatives.

#### Scenario: Selected counterpart is visible

- **WHEN** a leave or enter edge's other endpoint file is in the selected set
- **THEN** that endpoint appears under dependencies or dependents (not under hidden)

#### Scenario: Unselected counterpart is hidden

- **WHEN** a leave or enter edge's other endpoint file is not in the selected set
- **THEN** that endpoint appears under hiddenDependencies or hiddenDependents

### Requirement: Dependency keys between paths use snapshot edges

Given a cruise snapshot and two paths (each a file or folder in the snapshot), the system SHALL return the dependency keys of edges whose source side matches the first path and whose target side matches the second path for the dependencies direction, and the reverse for the dependents direction. A path matches a file when equal to that file; a path matches a folder when the file is under that folder's descendant files. Returned keys MUST be the snapshot edge ids (`ModuleDependency.id`). The system MUST NOT require a raw modules array for this lookup.

#### Scenario: File to file dependency keys

- **WHEN** keys are requested between two file paths in the dependencies direction and a leave edge exists from the first to the second
- **THEN** the result includes that edge's id

#### Scenario: Folder to path dependency keys

- **WHEN** keys are requested from a folder path to another path in the dependencies direction
- **THEN** the result includes ids of leave edges whose source is under the folder and whose target matches the other path

### Requirement: Related module sources use snapshot leave/enter edges

Given a cruise snapshot, a path, and a direction (dependencies or dependents), the system SHALL return the distinct module source paths related to that node via leave edges (dependencies) or enter edges (dependents). The system MUST NOT require a raw modules array for this lookup.

#### Scenario: Related dependency sources for a folder

- **WHEN** related sources are requested for a folder in the dependencies direction
- **THEN** the result is the distinct outside target files of that folder's leave edges

#### Scenario: Related dependent sources for a file

- **WHEN** related sources are requested for a file in the dependents direction
- **THEN** the result is the distinct source files of that file's enter edges

### Requirement: Dependency panel and highlight flows consume snapshot relations

The Dependency panel MUST compute path relations from the ambient cruise snapshot and the workspace selected-file set without reading graph expand/collapse state and without building a full modules array for relations. Highlight-edge flows that need related sources or dependency keys between paths MUST use the snapshot-based lookups rather than scanning `getCruiseModules` output.

#### Scenario: Dependency panel ignores collapse

- **WHEN** the user opens the Dependency panel for a folder and toggles that folder's expand/collapse on the graph
- **THEN** the panel's dependency and dependent lists do not change solely because of that toggle

#### Scenario: Highlight edge uses snapshot keys

- **WHEN** the user completes the highlight-edge source and target selection
- **THEN** dependency keys for highlighting come from the snapshot edge lookup between those paths
