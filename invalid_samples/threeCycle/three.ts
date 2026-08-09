import { getOne } from './one';

/** Intentional circular dependency sample (one → two → three → one). */
export function getThree(): string {
  return 'three';
}

/** Uses the next module in the three-module cycle. */
export function describeThree(): string {
  return `${getThree()}->${getOne()}`;
}
