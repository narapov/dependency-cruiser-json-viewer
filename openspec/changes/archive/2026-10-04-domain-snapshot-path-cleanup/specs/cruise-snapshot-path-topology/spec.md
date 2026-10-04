# Spec Delta

## ADDED Requirements

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
