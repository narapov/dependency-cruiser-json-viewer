# Proposal

## Why

Libavoid orthogonal edges render as sharp polylines (`L` corners), while drag / in-flight fallback and `simpleOrthogonal` use React Flow SmoothStep with rounded bends. That visual jump during drag is distracting. Orthogonal edges should share one corner language.

## What Changes

- Fillet orthogonal bends when converting libavoid routes to SVG paths (including paths with crossing hops).
- Pass an explicit SmoothStep `borderRadius` for `simpleOrthogonal` and for the libavoid smooth-step fallback.
- Share one corner-radius constant (`3`) across both path builders so styles stay aligned.

## Capabilities

### New Capabilities

- `graph-orthogonal-edge-corners`: Shared corner radius for all orthogonal dependency-edge presentations (`simpleOrthogonal`, libavoid routes, and libavoid smooth-step fallback).

### Modified Capabilities

- (none — `graph-libavoid-edges` was never synced into main `openspec/specs/`; corner presentation is introduced as its own capability rather than a phantom modify.)

## Impact

- `avoidRouteToPath` (and tests): bend fillets; hop arcs unchanged at radius 1.5.
- `getDependencyEdgePath` (and tests): explicit `borderRadius: 3` for orthogonal SmoothStep paths.
- Shared constants in `GraphCanvas/constants/edgePathConstants.ts`.
- No routing/worker/layout-cache changes; bezier and straight edges unchanged.
