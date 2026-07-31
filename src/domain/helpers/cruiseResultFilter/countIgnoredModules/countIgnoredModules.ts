import type { ICruiseResult } from 'dependency-cruiser';

import { isIgnoredPath } from '../isIgnoredPath';

/** Count modules whose source matches any ignore pattern. */
export function countIgnoredModules(result: ICruiseResult, patterns: string[]): number {
  if (patterns.length === 0) {
    return 0;
  }

  return result.modules.filter(module => isIgnoredPath(module.source, patterns)).length;
}
