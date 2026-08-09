import type { OneShape } from './one';

/** Intentional type-only circular dependency sample (one → two → three → one). */
export type ThreeShape = {
  kind: 'three';
  next?: OneShape;
};

/** Builds a typed three value for the type-only three-module cycle. */
export function createThree(): ThreeShape {
  return { kind: 'three' };
}
