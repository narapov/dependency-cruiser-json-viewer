import { getTwo } from './two';

/** Intentional circular dependency sample (one → two → three → one). */
export function getOne(): string {
  return 'one';
}

/** Uses the next module in the three-module cycle. */
export function describeOne(): string {
  return `${getOne()}->${getTwo()}`;
}
