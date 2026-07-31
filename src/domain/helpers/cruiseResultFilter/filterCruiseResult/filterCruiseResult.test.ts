import type { ICruiseResult, IModule, ISummary } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { filterCruiseResult } from './filterCruiseResult';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function cruiseResult(modules: IModule[]): ICruiseResult {
  return {
    modules,
    summary: {
      totalCruised: modules.length,
      violations: [],
      error: 0,
      warn: 0,
      info: 0,
      ignore: 0,
      optionsUsed: { args: '' },
      environment: {} as ISummary['environment'],
    },
  } as ICruiseResult;
}

describe('filterCruiseResult', () => {
  it('returns the same result when patterns are empty', () => {
    const result = cruiseResult([moduleAt('src/foo/a.ts'), moduleAt('src/foo/a.test.ts')]);

    expect(filterCruiseResult(result, [])).toBe(result);
  });

  it('excludes modules matching glob patterns', () => {
    const result = cruiseResult([
      moduleAt('src/foo/a.ts'),
      moduleAt('src/foo/a.test.ts'),
      moduleAt('src/foo/b.spec.tsx'),
    ]);

    const filtered = filterCruiseResult(result, ['**/*.test.ts', '**/*.spec.tsx']);

    expect(filtered.modules.map(module => module.source)).toEqual(['src/foo/a.ts']);
    expect(filtered.summary.totalCruised).toBe(1);
  });

  it('removes dependencies pointing to excluded modules', () => {
    const result = cruiseResult([
      moduleAt('src/foo/a.ts', [
        { resolved: 'src/foo/b.test.ts' } as IModule['dependencies'][0],
        { resolved: 'src/foo/c.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.test.ts'),
      moduleAt('src/foo/c.ts'),
    ]);

    const filtered = filterCruiseResult(result, ['**/*.test.ts']);

    expect(filtered.modules).toHaveLength(2);
    expect(filtered.modules[0]?.dependencies).toEqual([{ resolved: 'src/foo/c.ts' } as IModule['dependencies'][0]]);
  });

  it('returns the same result when no modules match patterns', () => {
    const result = cruiseResult([moduleAt('src/foo/a.ts')]);

    expect(filterCruiseResult(result, ['**/*.test.ts'])).toBe(result);
  });
});
