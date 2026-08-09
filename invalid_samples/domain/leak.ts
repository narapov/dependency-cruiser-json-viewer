import { sharedOk } from '../Shared/ok';

/** Intentional domain → Shared layer violation sample. */
export function domainLeak(): string {
  return `domain-leak->${sharedOk()}`;
}
