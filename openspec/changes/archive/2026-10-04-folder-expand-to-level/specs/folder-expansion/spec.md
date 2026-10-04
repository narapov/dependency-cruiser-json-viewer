# Spec Delta

## Purpose

Defines soft expand and collapse of cruise folder nodes by relative depth, including recursive walks and user actions that expand or collapse to a prompted level for an active folder, a context-menu folder, or all file-tree roots.

## ADDED Requirements

### Requirement: Soft expand by relative depth

The system SHALL soft-expand folder nodes by adding each visited folder's path to the expanded-folder set. Given one or more starting folder nodes from the cruise snapshot tree and a depth limit `N` (finite integer `>= 1`, or unlimited), the walk MUST visit folder children via snapshot `children` links only (no recomputation of folders from file-path strings). Callers that start from paths MUST resolve each path through the snapshot and MUST omit missing or non-folder entries (no `undefined` in the node list); unresolved paths are no-ops. For each starting node, the start folder itself is at relative depth `0`; a folder MUST be soft-expanded when its relative depth is strictly less than `N`. Unlimited depth MUST soft-expand every folder in each starting node's subtree, including the start. Soft expand MUST NOT remove any existing expanded-folder paths.

#### Scenario: Expand to level 1 adds only the start folder

- **WHEN** the user expands a folder to level `1`
- **THEN** that folder path is present in the expanded-folder set
- **AND** no descendant folder paths are added by that action

#### Scenario: Expand to level 2 adds start and direct child folders

- **WHEN** the user expands folder `src` to level `2` and `src` has folder children `src/App` and `src/domain`
- **THEN** `src`, `src/App`, and `src/domain` are present in the expanded-folder set
- **AND** folders nested under those children are not added by that action

#### Scenario: Expand recursive equals unlimited depth

- **WHEN** the user expands a folder recursively
- **THEN** every folder path in that folder's subtree (including the start) is present in the expanded-folder set

#### Scenario: Expand does not collapse deeper keys

- **WHEN** a deeper descendant folder is already expanded and the user expands an ancestor to a shallower level
- **THEN** the deeper descendant remains in the expanded-folder set

#### Scenario: Missing snapshot path is ignored

- **WHEN** expand-to-level is invoked with a path that is not present in the cruise snapshot
- **THEN** that path is skipped
- **AND** the expanded-folder set is otherwise updated only from paths that resolve to folder nodes

### Requirement: Soft collapse by relative depth

The system SHALL soft-collapse folder nodes by removing each visited folder's path from the expanded-folder set. Given one or more starting folder nodes and a depth limit `N` (`>= 1`), the walk MUST use snapshot `children` only. For each starting node, folders with relative depth strictly greater than or equal to `N` MUST be soft-collapsed. Soft collapse at level `N` MUST NOT remove the start folder when `N >= 1`. Soft collapse MUST NOT add any expanded-folder paths.

#### Scenario: Collapse to level 1 removes descendants only

- **WHEN** folders under `src` including `src` itself are expanded and the user collapses `src` to level `1`
- **THEN** descendant folder paths under `src` are absent from the expanded-folder set
- **AND** `src` remains in the expanded-folder set if it was expanded

#### Scenario: Collapse recursive clears the subtree including the start

- **WHEN** the user collapses a folder recursively
- **THEN** that folder path and every descendant folder path under it are absent from the expanded-folder set

#### Scenario: Collapse does not expand missing shallow keys

- **WHEN** an ancestor folder is collapsed and the user collapses a deeper folder to a level
- **THEN** the ancestor is not added to the expanded-folder set by that action

### Requirement: Roots expand and collapse to level

The system SHALL apply expand-to-level and collapse-to-level to every folder root in the cruise snapshot tree (`tree` values that are folders). Root-level file nodes MUST be ignored.

#### Scenario: Expand roots to level applies to each folder root

- **WHEN** the user expands roots to level `N` and the snapshot has multiple folder roots
- **THEN** each folder root is soft-expanded according to expand-to-level `N`

#### Scenario: Collapse roots to level applies to each folder root

- **WHEN** the user collapses roots to level `N`
- **THEN** each folder root's subtree is soft-collapsed according to collapse-to-level `N`

### Requirement: Level prompt for to-level actions

When the user invokes Expand to level or Collapse to level (for the active folder, a context-menu folder, or file-tree roots), the system SHALL prompt for a positive integer level with minimum value `1`. Canceling the prompt MUST leave the expanded-folder set unchanged. Confirming with a valid level MUST apply the corresponding expand or collapse operation.

#### Scenario: Cancel leaves expansion unchanged

- **WHEN** the user opens the level prompt and cancels
- **THEN** the expanded-folder set is unchanged

#### Scenario: Confirm applies the chosen level

- **WHEN** the user confirms level `2` for Expand to level on a folder
- **THEN** that folder is expanded according to expand-to-level `2`

### Requirement: To-level and collapse-recursive surfaces

The system SHALL expose Expand to level and Collapse to level for the active folder via the command palette, and for a folder via the FileTree and dependency-graph context menus. The system SHALL expose Expand roots to level and Collapse roots to level via the command palette as File Tree actions. The system SHALL expose Collapse Recursive on the FileTree and dependency-graph folder context menus alongside Expand Recursive.

#### Scenario: Active folder commands include to-level

- **WHEN** the user opens the command palette
- **THEN** commands exist to expand and collapse the active folder to a level

#### Scenario: Context menus include to-level and collapse recursive

- **WHEN** the user opens the context menu on a folder in the FileTree or graph
- **THEN** the menu includes Expand to level, Collapse to level, Expand Recursive, and Collapse Recursive
