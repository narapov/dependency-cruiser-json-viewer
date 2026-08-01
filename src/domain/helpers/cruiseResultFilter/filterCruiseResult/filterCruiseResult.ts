import type { ICruiseResult } from 'dependency-cruiser';

import { compileIgnoreMatchers } from '../compileIgnoreMatchers';

/** Drop ignored modules and edges that target them from a cruise result. */
export function filterCruiseResult(result: ICruiseResult, patterns: string[]): ICruiseResult {
  const matchers = compileIgnoreMatchers(patterns);
  if (matchers.length === 0) {
    return result;
  }

  const excluded = new Set(
    result.modules.filter(module => matchers.some(matcher => matcher(module.source))).map(module => module.source),
  );

  if (excluded.size === 0) {
    return result;
  }

  const modules = result.modules
    .filter(module => !excluded.has(module.source))
    .map(module => ({
      ...module,
      dependencies: (Array.isArray(module.dependencies) ? module.dependencies : []).filter(
        dependency => dependency.resolved == null || !excluded.has(dependency.resolved),
      ),
    }));

  return {
    ...result,
    modules,
    summary: {
      ...result.summary,
      totalCruised: modules.length,
    },
  };
}
