# cruise-snapshot-path-topology Specification

## Purpose

Defines that UI workspace flows resolve path hierarchy and membership from the loaded cruise snapshot node index, without reparsing path strings when the node already exists.

## Requirements

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

### Requirement: Module JSON uses snapshot module data

When a cruise snapshot is loaded and the user requests module JSON for a path that exists in that snapshot's path index, the system MUST resolve the dialog payload from snapshot node module data: the file node's origin module for a file path, or the origin modules of that folder node's descendant files for a folder path. The system MUST NOT resolve that payload by scanning `cruiseResult.modules` with path equality or path-prefix membership checks. When the path is absent from the snapshot path index, or no module data is available for it, the system MUST NOT open the module JSON dialog.

#### Scenario: File path opens its origin module

- **WHEN** the user requests module JSON for a file path that exists in the cruise snapshot and has an origin module
- **THEN** the module JSON dialog opens with that file's origin module as the payload

#### Scenario: Folder path opens descendant modules

- **WHEN** the user requests module JSON for a folder path that exists in the cruise snapshot and has at least one descendant file with an origin module
- **THEN** the module JSON dialog opens with those descendant origin modules as the payload

#### Scenario: Unknown path does not open the dialog

- **WHEN** the user requests module JSON for a path that is absent from the cruise snapshot path index
- **THEN** the module JSON dialog does not open

### Requirement: Workspace settings apply uses snapshot path index

When the workspace applies viewer settings against a loaded cruise result (hard reset with embedded settings, or sync of external workspace settings), the system MUST validate and filter settings paths using the cruise snapshot path index built for that result: a path is kept when it exists in the snapshot node index. Folder color keys MUST be limited to folder nodes in that index. Dependency highlight keys MUST be limited to dependency keys present in the snapshot dependency index. The system MUST NOT decide path membership for that apply by scanning module source strings with path-prefix checks or by walking parent segments of source strings.

#### Scenario: Stale expanded folder dropped on settings apply

- **WHEN** workspace settings list an expanded folder path that is absent from the cruise snapshot path index
- **THEN** that path is not kept as expanded after settings are applied

#### Scenario: Valid folder and file paths kept on settings apply

- **WHEN** workspace settings reference a file path and a folder path that both exist in the cruise snapshot path index
- **THEN** those paths remain available in the applied workspace view (subject to other settings filters such as selected-files file-only rules)

#### Scenario: Unknown highlight key dropped on settings apply

- **WHEN** workspace settings include a user edge highlight whose dependency key is absent from the snapshot dependency index
- **THEN** that highlight is not kept after settings are applied

### Requirement: Soft reconcile uses snapshot path index

When the workspace soft-reconciles existing UI fields against a newly built cruise snapshot (soft reset or ignore-pattern rebuild), path validity for expanded folders, active path, and panel paths MUST use the snapshot path index (`nodes` membership). Layout pruning MUST treat a path as valid when it exists in that index. The system MUST NOT rebuild folder membership for that reconcile by slicing path strings or by prefix-matching against a module-source list.

#### Scenario: Soft reconcile keeps indexed panel path

- **WHEN** the previous applicable-rules panel path exists in the new cruise snapshot path index
- **THEN** soft reconcile keeps that panel path

#### Scenario: Soft reconcile clears path absent from index

- **WHEN** the previous active path is absent from the new cruise snapshot path index
- **THEN** soft reconcile clears the active path

#### Scenario: Soft reconcile prunes layout against snapshot nodes

- **WHEN** a stored node layout references a child path that is absent from the new cruise snapshot path index
- **THEN** soft reconcile drops that child from the kept layouts
