import { getAlpha } from './alpha';

/** Intentional circular dependency sample (alpha ↔ beta). */
export function getBeta(): string {
  return 'beta';
}

/** Uses the peer in the two-module cycle. */
export function describeBeta(): string {
  return `${getBeta()}->${getAlpha()}`;
}
