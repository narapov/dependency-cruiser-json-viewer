# Design

## Context

See proposal.md — Why. Mermaid export already serializes topology, colors, and edge `classDef`s. DOT export takes `edgesType` and emits graph-level `splines` via `toDotSplines`. Mermaid serialize and `buildMermaid` omit `edgesType` today. Mermaid expresses edge shape globally with `%%{init: {'flowchart': {'curve': '<name>'}}}%%`, not per-edge geometry.

## Goals / Non-Goals

**Goals:**

- Thread workspace `edgesType` into Mermaid export the same way as DOT.
- Always emit a Mermaid init front-matter line with `flowchart.curve` from the locked mapping.
- Keep existing topology/color/edge-class behavior unchanged aside from the new prefix and the “starts with flowchart LR” expectation.

**Non-Goals:**

- Matching libavoid or React Flow path geometry in Mermaid.
- Distinguishing `simpleOrthogonal` vs `libavoidOrthogonal` in Mermaid (both → `step`, like DOT both → `ortho`).
- Per-edge curve overrides; online Mermaid viewer; new Quick Pick commands.

## Decisions

### 1. Mapper twin of `toDotSplines`

Add `toMermaidCurve(edgesType): string` next to Mermaid serialize helpers (or co-located in the same module as other Mermaid export helpers), exhaustive over `GraphEdgesType`:

| `edgesType`          | `curve`  |
| -------------------- | -------- |
| `bezier`             | `basis`  |
| `straight`           | `linear` |
| `simpleOrthogonal`   | `step`   |
| `libavoidOrthogonal` | `step`   |

**Why:** Locked in explore; mirrors DOT’s collapse of both ortho modes.  
**Alternative:** Omit init for `basis` — rejected; always emit for self-describing exports.

### 2. Always prefix, then `flowchart LR`

First line(s) of the file:

```text
%%{init: {'flowchart': {'curve': '<mapped>'}}}%%
flowchart LR
...
```

Use a stable JSON-ish init form that Mermaid hosts commonly accept (single-quoted keys/values as above, or equivalent compact JSON). Do not put the init inside the flowchart body.

**Why:** Product choice — always present, including `basis`.  
**Alternative:** Rely on Mermaid default for bezier — rejected.

### 3. Wire `edgesType` through the same path as DOT

Extend `SerializeGraphToMermaidInput` with `edgesType`. Pass it from `useDependencyGraphImperativeRef`’s `buildMermaid` (value already in the hook for DOT). Update unit tests that call `serializeGraphToMermaid` to pass an edges type (default `bezier` in fixtures is fine).

**Why:** Single source of truth with canvas/workspace setting.  
**Alternative:** Hard-code `basis` — rejected.

## Risks / Trade-offs

- **[Risk] Some Markdown Mermaid renderers ignore `%%{init}%%`** → Mitigation: accepted; topology and styles remain; document like other Mermaid host limits.
- **[Trade-off] `step` is only an approximation of orthogonal routing** → Accepted; same honesty as DOT `splines=ortho` for both ortho modes.
- **[Risk] Init quoting/escaping differences across Mermaid versions** → Mitigation: unit-assert the exact prefix string; keep the form minimal.

## Migration Plan

- Additive prefix on `.mmd` content; no workspace schema change.
- Rollback: stop passing `edgesType` / drop init emission.

## Open Questions

- None.
