import type { AlphaShape } from './alpha';

/** Intentional type-only circular dependency sample (alpha ↔ beta). */
export type BetaShape = {
  kind: 'beta';
  peer?: AlphaShape;
};

/** Builds a typed beta value for the type-only cycle. */
export function createBeta(): BetaShape {
  return { kind: 'beta' };
}
