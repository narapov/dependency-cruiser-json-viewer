# Spec Delta

## Purpose

Keeps leaf nodes and folder groups visually framed in Graphviz DOT and Mermaid downloads by requiring an explicit shared border width alongside the existing border colors.

## ADDED Requirements

### Requirement: Explicit border width on exported nodes and folder groups

The system SHALL emit an explicit border width for every leaf node and folder group (DOT cluster / Mermaid subgraph) in Graphviz DOT and Mermaid exports of the visible graph. DOT MUST set `penwidth` to that width on those nodes and clusters. Mermaid MUST set `stroke-width` to that width on the corresponding leaf and subgraph style directives (including file `classDef` entries that define stroke). The width MUST be the same shared export value for both formats. Existing border colors MUST remain unchanged. Edge stroke widths are out of scope for this requirement.

#### Scenario: DOT leaf and cluster include penwidth

- **WHEN** the user exports the visible graph as Graphviz DOT and the graph includes a file leaf and an expanded folder group
- **THEN** the DOT source sets `penwidth` on that leaf node and on that folder cluster
- **AND** the penwidth value matches the shared export node border width
- **AND** the existing border `color` attributes remain present

#### Scenario: Mermaid leaf and subgraph include stroke-width

- **WHEN** the user exports the visible graph as Mermaid and the graph includes a styled file leaf and an expanded folder subgraph
- **THEN** the Mermaid source includes `stroke-width` on that leaf’s style or class definition and on that subgraph’s style
- **AND** the stroke-width value matches the shared export node border width used by DOT
- **AND** the existing stroke colors remain present
