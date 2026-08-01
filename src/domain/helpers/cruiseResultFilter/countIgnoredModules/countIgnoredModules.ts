import type { ICruiseResult } from 'dependency-cruiser';

import { compileIgnoreMatchers } from '../compileIgnoreMatchers';

/** Count modules whose source matches any ignore pattern. */
export function countIgnoredModules(result: ICruiseResult, patterns: string[]): number {
  const matchers = compileIgnoreMatchers(patterns);
  if (matchers.length === 0) {
    return 0;
  }

  return result.modules.filter(module => matchers.some(matcher => matcher(module.source))).length;
}
