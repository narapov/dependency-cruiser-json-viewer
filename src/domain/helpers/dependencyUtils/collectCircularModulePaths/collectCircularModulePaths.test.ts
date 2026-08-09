import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { collectCircularModulePaths } from './collectCircularModulePaths';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true };
}

describe('collectCircularModulePaths', () => {
  it('returns empty array when there are no circular dependencies', () => {
    const modules = [
      moduleAt('src/a.ts', [{ resolved: 'src/b.ts', circular: false } as IModule['dependencies'][0]]),
      moduleAt('src/b.ts'),
    ];

    expect(collectCircularModulePaths(modules)).toEqual([]);
  });

  it('includes both ends of a value circular dependency', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        {
          resolved: 'src/foo/b.ts',
          circular: true,
          dependencyTypes: ['local', 'import'],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts'),
      moduleAt('src/bar/c.ts'),
    ];

    expect(collectCircularModulePaths(modules).sort()).toEqual(['src/foo/a.ts', 'src/foo/b.ts']);
  });

  it('includes both ends of a type-only circular dependency', () => {
    const modules = [
      moduleAt('src/bar/c.ts', [
        {
          resolved: 'src/bar/d.ts',
          circular: true,
          dependencyTypes: ['local', 'type-only', 'import'],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/bar/d.ts'),
    ];

    expect(collectCircularModulePaths(modules).sort()).toEqual(['src/bar/c.ts', 'src/bar/d.ts']);
  });

  it('deduplicates paths across multiple circular edges', () => {
    const modules = [
      moduleAt('src/a.ts', [{ resolved: 'src/b.ts', circular: true } as IModule['dependencies'][0]]),
      moduleAt('src/b.ts', [{ resolved: 'src/a.ts', circular: true } as IModule['dependencies'][0]]),
    ];

    expect(collectCircularModulePaths(modules).sort()).toEqual(['src/a.ts', 'src/b.ts']);
  });
});
