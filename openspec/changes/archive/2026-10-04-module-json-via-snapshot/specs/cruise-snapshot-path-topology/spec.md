# Spec Delta

## ADDED Requirements

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
