import { appOk } from '../App/ok';

/** Intentional Shared → App layer violation sample. */
export function sharedLeak(): string {
  return `shared-leak->${appOk()}`;
}
