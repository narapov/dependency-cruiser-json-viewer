# graph-pure-layout Specification

## Purpose

Defines pure graph layout that returns new sized/positioned nodes from the visible tree, and derives frozen edge endpoint ports directly from that layouted tree without parent-map adapters.

## Requirements

### Requirement: Layout returns new nodes without mutating the visible tree

When building the dependency graph, the system SHALL compute layout as a pure transform from the current visible tree (plus cruise snapshot, selection, and optional layout cache) into new layouted nodes that include relative `position`, `width`, and `height`. The input visible-tree objects MUST remain unchanged after layout completes. Layout MUST NOT rely on a preparatory mutable clone whose only purpose is to receive in-place geometry writes.

#### Scenario: Visible tree untouched after build

- **WHEN** a graph build runs layout on a visible tree
- **THEN** the visible-tree node objects supplied as input keep their pre-layout field values
- **AND** the build result exposes different layouted node objects that carry positions and sizes

#### Scenario: Layouted nodes carry geometry

- **WHEN** layout finishes for a non-empty visible tree
- **THEN** every layouted node in the result has finite `width` and `height` and a relative `position`
- **AND** expanded folder nodes include layouted children with parent-relative positions

### Requirement: Edge ports from layouted tree and edges

After layout, the system SHALL compute frozen EAST/WEST endpoint ports for visible edges with a single operation that accepts the layouted tree and the edge list and returns a map from edge key to source/target ports. Absolute ordering of port slots MUST use layouted geometry and each node's ancestor chain (or equivalent parent linkage already on the layouted nodes). The operation MUST NOT require a separately built `parentByNode` map or a flattened intermediate node DTO list reshaped only for port assignment.

#### Scenario: Ports derived without parent map adapter

- **WHEN** the build computes edge ports after layout
- **THEN** ports are produced from the layouted tree and edges alone
- **AND** sibling edges on the same node side remain ordered top-to-bottom by the opposite endpoint's absolute center Y

#### Scenario: Result field is edgesPorts

- **WHEN** a successful graph build completes
- **THEN** the build result exposes the port map as `edgesPorts` keyed by edge key
- **AND** React Flow edge conversion consumes that map for `sourcePort` / `targetPort` on edge data
