# Spec Delta

## MODIFIED Requirements

### Requirement: Export visible graph as Mermaid file

The system SHALL provide a user command that downloads a Mermaid flowchart file (`.mmd`) representing the currently visible dependency graph. The export MUST include the same nodes and dependency edges that are shown on the graph canvas after ignore patterns, file selection, and folder expansion. The diagram MUST start with `flowchart LR`. Expanded folder groups MUST be represented as nested Mermaid subgraphs; collapsed folders and files MUST appear as leaf nodes. Leaf and subgraph display labels MUST use the same basename labels shown on the canvas. Node and subgraph identifiers in the Mermaid source MUST be safe for Mermaid parsing (they MUST NOT use raw filesystem paths as bare ids).

Node and subgraph colors in the Mermaid source MUST match DOT export color semantics for the same visible graph: folder and folder-group fills from canvas folder colors (normalized to export-safe hex with the same lightening rules as DOT), file circular and unresolved fills/strokes as in DOT, and default file fill/stroke as in DOT.

Dependency edges in the Mermaid source MUST use explicit edge identifiers and named style classes so edge colors can be attached by class rather than only by link index. Edge stroke colors MUST follow DOT export semantics for error, circular, type-only-circular, warning, and default edges. Type-only dependencies MUST use a dashed stroke. When a user edge highlight applies to an edge, the Mermaid edge MUST use that highlight color and a thicker stroke, matching DOT highlight treatment. Semantic and highlight edge styles MUST be expressed with Mermaid `classDef` (and class assignment to edge ids).

The export MUST download a local file and MUST NOT open an external Mermaid viewer.

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

#### Scenario: Folder and file node colors match DOT semantics

- **WHEN** the visible graph includes a colored folder or folder group, a circular file, and an unresolved file
- **THEN** the Mermaid export includes style directives whose fills and strokes match DOT export color semantics for those nodes and subgraphs

#### Scenario: Edge colors use classDef on edge ids

- **WHEN** the visible graph includes circular, warning, error, and default dependency edges
- **THEN** the Mermaid export assigns explicit ids to those edges
- **AND** defines `classDef` entries for the corresponding DOT semantic edge colors
- **AND** assigns those classes to the edge ids

#### Scenario: Type-only edges are dashed and highlights override color

- **WHEN** the visible graph includes a type-only edge and an edge with a user highlight color
- **THEN** the Mermaid export styles the type-only edge with a dashed stroke
- **AND** styles the highlighted edge with the highlight color and a thicker stroke

#### Scenario: Export does not open an online Mermaid viewer

- **WHEN** the user runs the Mermaid export command
- **THEN** the system downloads a local `.mmd` file
- **AND** the system does not navigate to or open mermaid.live (or another external Mermaid host)
