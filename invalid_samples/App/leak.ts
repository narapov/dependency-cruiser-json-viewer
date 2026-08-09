import { featureDeep } from './partials/Feature/helpers/deep';

/** Intentional App-root deep partial import violation sample. */
export function appLeak(): string {
  return `app-leak->${featureDeep()}`;
}
