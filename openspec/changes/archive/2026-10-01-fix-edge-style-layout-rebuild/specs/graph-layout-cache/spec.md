# Spec Delta

## ADDED Requirements

### Requirement: Edge style change does not rebuild layout

Changing the graph edge style MUST NOT trigger a graph rebuild and MUST NOT reset the live layout cache from persisted workspace layouts. Edge style is a presentation concern applied when rendering edges; node positions and group layouts MUST remain as they were (including unsaved drag updates still only in the live cache).

#### Scenario: Switch edge style keeps live layout

- **WHEN** the user has dragged nodes (positions present in the live layout cache but not yet saved to the workspace) and then changes the graph edge style
- **THEN** edge paths update to the new style and the live layout cache (and visible node positions) are unchanged; no graph build is started solely for that style change

#### Scenario: Edge style change with auto-layout-only

- **WHEN** auto-layout-only mode is on and the user changes the graph edge style
- **THEN** edge paths update to the new style and no graph build is started solely for that style change
