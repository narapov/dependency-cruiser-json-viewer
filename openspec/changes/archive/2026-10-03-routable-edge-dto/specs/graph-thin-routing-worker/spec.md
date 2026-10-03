# Spec Delta

## ADDED Requirements

### Requirement: Thin routing edges come from App routable edges

When scheduling libavoid orthogonal routing, the system SHALL project thin routing edges from the App routable edge collection (ids, endpoints, and frozen ports). That projection MUST NOT depend on React Flow edge objects or casting React Flow `edge.data` to recover ports.

#### Scenario: Thin edges from App model

- **WHEN** a libavoid routing generation starts after layout settles
- **THEN** each thin routing edge id/source/target/ports is taken from the corresponding App routable edge
- **AND** the scheduler does not read React Flow edges to build the thin edge list

#### Scenario: Frozen ports preserved without RF round-trip

- **WHEN** an App routable edge carries frozen EAST/WEST ports from layout
- **THEN** those ports appear on the thin routing edge in the worker payload
- **AND** no intermediate React Flow edge is required to carry those ports into the worker
