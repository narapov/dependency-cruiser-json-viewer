# Spec Delta

## ADDED Requirements

### Requirement: Libavoid edges type is presentation-only

Selecting, clearing, or applying `libavoidOrthogonal` routes MUST NOT trigger a graph rebuild and MUST NOT reset the live layout cache from persisted workspace layouts. Node positions and group layouts MUST remain as they were (including unsaved drag updates still only in the live cache). Drag while `libavoidOrthogonal` is selected MUST continue to update the live layout cache per the existing drag requirements and MUST NOT start a graph rebuild solely because of the drag or because libavoid routing is suspended or restarted after drag stop.

#### Scenario: Switch to libavoid keeps live layout

- **WHEN** the user has dragged nodes (positions present in the live layout cache but not yet saved) and then sets edges type to `libavoidOrthogonal`
- **THEN** a worker may compute edge routes, but the live layout cache and visible node positions are unchanged and no graph build is started solely for that edges-type change

#### Scenario: Drag under libavoid still updates cache without rebuild

- **WHEN** `edgesType` is `libavoidOrthogonal` and the user drags a node (auto-layout-only off)
- **THEN** sibling settle and ancestor growth update the live layout cache as for other edges types, edges use smooth-step during the drag, and no graph build is started solely for that drag

#### Scenario: Post-drag route does not rebuild

- **WHEN** drag ends under `libavoidOrthogonal` and a worker routing pass is scheduled
- **THEN** applying the returned routes updates edge presentation only and does not start a graph build solely for that routing result
