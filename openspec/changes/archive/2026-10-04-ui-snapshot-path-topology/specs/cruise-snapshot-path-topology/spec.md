# Spec Delta

## Purpose

Defines that UI workspace flows resolve path hierarchy and membership from the loaded cruise snapshot node index, without reparsing path strings when the node already exists.

## ADDED Requirements

### Requirement: UI path hierarchy uses snapshot node fields

When a cruise snapshot is loaded and a path exists in that snapshot's path index, UI workspace flows that need that path's ancestor folders or parent folder MUST read them from the snapshot node (`ancestors`, `parent`). Those flows MUST NOT derive hierarchy by reparsing the path string (including parent-walk helpers that slice path segments) for an indexed path.

#### Scenario: Activate expands snapshot ancestors

- **WHEN** the user activates a path that exists in the cruise snapshot
- **THEN** the folders expanded for that activation are exactly that path node's ancestor folders from the snapshot
- **AND** hierarchy is not recomputed by slicing the path string

#### Scenario: Show-related expands related nodes' ancestors

- **WHEN** a UI action expands folders so related module paths become visible
- **THEN** each related path that exists in the snapshot contributes its snapshot ancestor folders
- **AND** missing/unindexed paths contribute no ancestors

#### Scenario: Active folder uses snapshot parent

- **WHEN** the active path is a file that exists in the cruise snapshot
- **THEN** the active folder for folder-scoped UI actions is that file node's parent from the snapshot

### Requirement: UI path membership uses snapshot index

When a cruise snapshot is loaded, UI flows that decide whether a stored path is still a valid cruise path (active path, dependency panel path, applicable-rules panel path) MUST treat the path as valid when it exists in the snapshot path index. Those flows MUST NOT decide membership by scanning module source strings with path-prefix checks.

#### Scenario: Active path resolved via snapshot index

- **WHEN** the stored active path exists as a node in the cruise snapshot
- **THEN** UI surfaces that expose the resolved active path treat it as valid

#### Scenario: Stale panel path rejected via snapshot index

- **WHEN** a stored panel path is absent from the cruise snapshot path index
- **THEN** UI surfaces that expose that panel path treat it as unset

### Requirement: Selection visibility uses descendant files

When UI decides whether a path is visible under the current file selection (for example, whether focusing the graph for that path is allowed), the system MUST use the selection presence record together with the path node's descendant files from the snapshot. The system MUST NOT determine visibility by comparing path strings with a prefix (`path/`).

#### Scenario: Folder visible when a descendant file is selected

- **WHEN** a folder path exists in the snapshot and at least one of its descendant files is present in the selection record
- **THEN** that folder is treated as visible under the selection

#### Scenario: Path not visible when neither it nor descendants are selected

- **WHEN** a path exists in the snapshot and neither the path nor any of its descendant files is present in the selection record
- **THEN** that path is treated as not visible under the selection
