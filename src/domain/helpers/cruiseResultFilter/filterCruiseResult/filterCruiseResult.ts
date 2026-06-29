import type { ICruiseResult } from 'dependency-cruiser';

import { isIgnoredPath } from '../isIgnoredPath';

export function filterCruiseResult(result: ICruiseResult, patterns: string[]): ICruiseResult {
  if (patterns.length === 0) {
    return result;
  }

  const excluded = new Set(
    result.modules.filter(module => isIgnoredPath(module.source, patterns)).map(module => module.source),
  );

  if (excluded.size === 0) {
    return result;
  }

  const modules = result.modules
    .filter(module => !excluded.has(module.source))
    .map(module => ({
      ...module,
      dependencies: module.dependencies.filter(
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
