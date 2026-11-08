# Spec Delta

## Purpose

Lets users download the currently visible dependency graph as a Mermaid flowchart (`.mmd`) for use in Markdown docs and reviews, matching the same selection and folder-expansion scope as the on-screen graph.

## ADDED Requirements

### Requirement: Export visible graph as Mermaid file

The system SHALL provide a user command that downloads a Mermaid flowchart file (`.mmd`) representing the currently visible dependency graph. The export MUST include the same nodes and dependency edges that are shown on the graph canvas after ignore patterns, file selection, and folder expansion. The diagram MUST start with `flowchart LR`. Expanded folder groups MUST be represented as nested Mermaid subgraphs; collapsed folders and files MUST appear as leaf nodes. Leaf and subgraph display labels MUST use the same basename labels shown on the canvas. Node and subgraph identifiers in the Mermaid source MUST be safe for Mermaid parsing (they MUST NOT use raw filesystem paths as bare ids). The export MUST NOT include visual styling such as colors, highlight classes, circular/unresolved markers, or dashed type-only edge styles. The export MUST download a local file and MUST NOT open an external Mermaid viewer.

#### Scenario: Command downloads Mermaid for the visible graph

- **WHEN** the user runs the Mermaid export command while a cruise result is loaded and the graph shows visible nodes and edges
- **THEN** the system downloads a `.mmd` file whose content begins with `flowchart LR`
- **AND** every visible leaf node appears in the diagram with its canvas basename label
- **AND** every visible dependency edge between those leaves appears as a Mermaid edge

#### Scenario: Expanded folders become nested subgraphs

- **WHEN** a folder is expanded on the canvas so its children are shown inside a folder group
- **THEN** the Mermaid export contains a nested subgraph for that folder group
- **AND** the group's children appear inside that subgraph

#### Scenario: Collapsed folder exports as a single leaf

- **WHEN** a folder is collapsed on the canvas so it appears as a single folder leaf with lifted edges
- **THEN** the Mermaid export contains that folder as a leaf node
- **AND** edges that terminate at that collapsed folder in the visible graph terminate at that leaf in the Mermaid source

#### Scenario: Path-like ids do not break Mermaid syntax

- **WHEN** visible node paths contain `/`, hyphens, or names that collide with Mermaid reserved words
- **THEN** the exported Mermaid source still uses safe identifiers for nodes and subgraphs
- **AND** the displayed labels still show the basename labels from the canvas

#### Scenario: Phase-1 export has no styling directives

- **WHEN** the user exports Mermaid for a graph that includes circular edges, user edge highlights, or type-only dependencies
- **THEN** the Mermaid source has no `classDef`, `style`, `linkStyle`, or dashed-edge styling directives for those states

#### Scenario: Export does not open an online Mermaid viewer

- **WHEN** the user runs the Mermaid export command
- **THEN** the system downloads a local `.mmd` file
- **AND** the system does not navigate to or open mermaid.live (or another external Mermaid host)
