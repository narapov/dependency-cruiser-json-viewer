# Proposal

## Why

DOT export already mirrors the workspace edges-type setting via Graphviz `splines`, but Mermaid export always uses the host default curve. Docs that switch between DOT and Mermaid (or that match the on-canvas edges picker) need the same edges-type intent encoded in the `.mmd`.

## What Changes

- Pass workspace `edgesType` into Mermaid serialization (same source as DOT).
- Always prefix the Mermaid file with a `%%{init: {'flowchart': {'curve': '…'}}}%%` directive mapped from `edgesType`:
  - `bezier` → `basis`
  - `straight` → `linear`
  - `simpleOrthogonal` / `libavoidOrthogonal` → `step`
- Update the Mermaid export requirement so the file starts with that init line, then `flowchart LR` (not bare `flowchart LR` alone).
- **BREAKING** (Mermaid consumers): exported `.mmd` gains an init front-matter line; hosts that ignore `%%{init}%%` keep topology/styles but may ignore the curve — accepted.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `graph-export-mermaid`: Mermaid download MUST encode workspace edges type as Mermaid flowchart `curve` via a always-present init directive.

## Impact

- `serializeGraphToMermaid` input gains `edgesType`; add `toMermaidCurve` (DOT twin of `toDotSplines`).
- `useDependencyGraphImperativeRef` `buildMermaid` passes `edgesType` already available for DOT.
- Unit tests for the mapper and init prefix; no new commands, deps, or UI.
