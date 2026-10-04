# Spec Delta

## Purpose

Defines how the workspace stores and updates the expanded-folder presence record, including merge versus replace writes and adjusting the active path when folders collapse.

## ADDED Requirements

### Requirement: Expanded-folder presence semantics

The workspace SHALL store expanded folders as a presence record from path to boolean-or-undefined. A path MUST be treated as expanded only when its value is `true`. Values `false` and `undefined` MUST both mean not expanded (absent). Callers MAY write either `false` or `undefined` to mark a path absent.

#### Scenario: True means expanded

- **WHEN** the expanded-folder record contains `{ "src": true }`
- **THEN** path `src` is expanded

#### Scenario: False means not expanded

- **WHEN** the expanded-folder record contains `{ "src": false }`
- **THEN** path `src` is not expanded

#### Scenario: Undefined means not expanded

- **WHEN** the expanded-folder record contains `{ "src": undefined }` or omits `src`
- **THEN** path `src` is not expanded

### Requirement: Merge update of expanded folders

When the workspace updates expanded folders without a replace option (or with replace disabled), the system SHALL merge the provided record into the current record so that provided keys overwrite existing keys and keys not present in the update remain unchanged.

#### Scenario: Soft expand merges true keys

- **WHEN** the current record is `{ "src": true }` and the workspace merges `{ "src/App": true }`
- **THEN** the resulting record includes both `src` and `src/App` as expanded

#### Scenario: Soft collapse sets absent without clearing peers

- **WHEN** the current record is `{ "src": true, "src/App": true }` and the workspace merges `{ "src/App": false }`
- **THEN** `src` remains expanded
- **AND** `src/App` is not expanded

### Requirement: Replace update of expanded folders

When the workspace updates expanded folders with replace enabled, the system SHALL replace the entire expanded-folder record with the provided record. Keys absent from the provided record MUST NOT remain expanded from the previous record.

#### Scenario: Replace clears omitted keys

- **WHEN** the current record is `{ "src": true, "src/App": true }` and the workspace replaces with `{ "src": true }`
- **THEN** `src` remains expanded
- **AND** `src/App` is not expanded

#### Scenario: Replace with empty clears all

- **WHEN** the current record has one or more expanded paths and the workspace replaces with `{}`
- **THEN** no path is expanded

### Requirement: Active path after collapse

When an update causes one or more folder paths to change from expanded (`true`) to not expanded (`false` or `undefined`), and the current active path lies under a collapsed folder, the system SHALL move the active path to the deepest such collapsed folder. When no folder collapses, or the active path is unaffected, the active path MUST remain unchanged.

#### Scenario: Collapse moves active path to deepest collapsed ancestor

- **WHEN** `src` and `src/foo` are expanded, the active path is `src/foo/bar.ts`, and an update collapses `src/foo`
- **THEN** the active path becomes `src/foo`

#### Scenario: Expand-only update leaves active path unchanged

- **WHEN** the active path is `src/a.ts` and an update only adds expanded paths
- **THEN** the active path remains `src/a.ts`
