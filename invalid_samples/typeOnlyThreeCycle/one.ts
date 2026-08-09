import type { TwoShape } from './two';

/** Intentional type-only circular dependency sample (one → two → three → one). */
export type OneShape = {
  kind: 'one';
  next?: TwoShape;
};

/** Builds a typed one value for the type-only three-module cycle. */
export function createOne(): OneShape {
  return { kind: 'one' };
}
