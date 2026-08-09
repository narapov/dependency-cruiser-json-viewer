import type { BetaShape } from './beta';

/** Intentional type-only circular dependency sample (alpha ↔ beta). */
export type AlphaShape = {
  kind: 'alpha';
  peer?: BetaShape;
};

/** Builds a typed alpha value for the type-only cycle. */
export function createAlpha(): AlphaShape {
  return { kind: 'alpha' };
}
