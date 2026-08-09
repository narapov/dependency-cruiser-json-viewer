import type { ThreeShape } from './three';

/** Intentional type-only circular dependency sample (one → two → three → one). */
export type TwoShape = {
  kind: 'two';
  next?: ThreeShape;
};

/** Builds a typed two value for the type-only three-module cycle. */
export function createTwo(): TwoShape {
  return { kind: 'two' };
}
