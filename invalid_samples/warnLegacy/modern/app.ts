import { legacyOld } from '../legacy/old';

/** Intentional modern → legacy import (warn) sample. */
export function modernApp(): string {
  return `modern->${legacyOld()}`;
}
