# Spec Delta

## MODIFIED Requirements

### Requirement: Active path after collapse

When an update causes one or more folder paths to change from expanded (`true`) to not expanded (`false` or `undefined`), and the current active path lies under a collapsed folder, the system SHALL move the active path to the deepest such collapsed folder. When a cruise snapshot is loaded and the active path exists in that snapshot's path index, “lies under” MUST be decided from that path node's snapshot `ancestors` (nearest parent → root): the deepest collapsed folder is the first ancestor that is among the folders that just collapsed. The system MUST NOT decide that relationship by comparing path strings with a prefix (`folder/`). When the active path is absent from the snapshot path index, or no collapsed ancestor matches, the active path MUST remain unchanged. When no folder collapses, or the active path is unaffected, the active path MUST remain unchanged. Collapsing the active folder itself (when the active path equals a collapsed folder) MUST leave that folder as the active path.

#### Scenario: Collapse moves active path to deepest collapsed ancestor

- **WHEN** `src` and `src/foo` are expanded, the active path is `src/foo/bar.ts`, and an update collapses `src/foo`
- **THEN** the active path becomes `src/foo`

#### Scenario: Expand-only update leaves active path unchanged

- **WHEN** the active path is `src/a.ts` and an update only adds expanded paths
- **THEN** the active path remains `src/a.ts`

#### Scenario: Collapse uses snapshot ancestors not path prefix

- **WHEN** the active path exists in the cruise snapshot and an update collapses one of that path node's ancestor folders
- **THEN** the active path moves to the deepest collapsed ancestor from the snapshot node
- **AND** hierarchy is not decided by slicing or prefix-matching the active path string

#### Scenario: Collapsing the active folder keeps it active

- **WHEN** the active path is `src/foo` and an update collapses `src/foo`
- **THEN** the active path remains `src/foo`
