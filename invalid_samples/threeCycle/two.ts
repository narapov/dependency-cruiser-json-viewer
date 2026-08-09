import { getThree } from './three';

/** Intentional circular dependency sample (one → two → three → one). */
export function getTwo(): string {
  return 'two';
}

/** Uses the next module in the three-module cycle. */
export function describeTwo(): string {
  return `${getTwo()}->${getThree()}`;
}
