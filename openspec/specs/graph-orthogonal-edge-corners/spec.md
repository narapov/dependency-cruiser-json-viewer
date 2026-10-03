# graph-orthogonal-edge-corners Specification

## Purpose

Keeps all orthogonal dependency-edge presentations visually consistent by applying a shared corner radius to smooth-step paths and to libavoid route paths (including when crossing hops are drawn).

## Requirements

### Requirement: Shared orthogonal corner radius

All orthogonal dependency-edge presentations MUST use a shared corner radius of 3 canvas units at axis-aligned bends. This applies to `simpleOrthogonal` edges, to libavoid-routed edges when those routes are rendered, and to the smooth-step fallback used while libavoid routing is in flight or suspended for drag. Bezier and straight edges MUST NOT be affected. Crossing-hop semicircle radius MUST remain 1.5 and independent of the bend corner radius.

#### Scenario: Simple orthogonal bends are rounded

- **WHEN** `edgesType` is `simpleOrthogonal` and an edge path has at least one axis-aligned bend
- **THEN** that bend is drawn with a corner radius of 3 (not a sharp right angle)

#### Scenario: Libavoid route bends are rounded

- **WHEN** `edgesType` is `libavoidOrthogonal` and an edge renders a computed libavoid route with at least one bend
- **THEN** each axis-aligned bend in that path is drawn with a corner radius of 3

#### Scenario: Libavoid fallback matches the same radius

- **WHEN** `edgesType` is `libavoidOrthogonal` and the edge falls back to smooth-step (routing in flight or mid-drag)
- **THEN** smooth-step bends use corner radius 3, matching libavoid-routed corners

#### Scenario: Short segments clamp the fillet

- **WHEN** an orthogonal bend connects two segments shorter than twice the corner radius
- **THEN** the fillet radius is clamped so the path remains continuous and does not overshoot either adjacent segment

#### Scenario: Crossing hops keep their own radius

- **WHEN** a non-emphasized libavoid edge path includes a crossing hop on a horizontal segment
- **THEN** the hop semicircle still uses radius 1.5, and bend corners on that path still use radius 3
