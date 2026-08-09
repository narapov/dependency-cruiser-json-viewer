import { getBeta } from './beta';

/** Intentional circular dependency sample (alpha ↔ beta). */
export function getAlpha(): string {
  return 'alpha';
}

/** Uses the peer in the two-module cycle. */
export function describeAlpha(): string {
  return `${getAlpha()}->${getBeta()}`;
}
