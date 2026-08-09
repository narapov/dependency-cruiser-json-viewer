import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { collectDistinctCycles } from './collectDistinctCycles';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true };
}

describe('collectDistinctCycles', () => {
  it('returns empty array when there are no circular dependencies', () => {
    const modules = [
      moduleAt('src/a.ts', [{ resolved: 'src/b.ts', circular: false } as IModule['dependencies'][0]]),
      moduleAt('src/b.ts'),
    ];

    expect(collectDistinctCycles(modules)).toEqual([]);
  });

  it('collects a two-module cycle including type-only', () => {
    const modules = [
      moduleAt('src/alpha.ts', [
        {
          resolved: 'src/beta.ts',
          circular: true,
          dependencyTypes: ['local', 'type-only', 'import'],
          cycle: [
            { name: 'src/beta.ts', dependencyTypes: ['local', 'type-only', 'import'] },
            { name: 'src/alpha.ts', dependencyTypes: ['local', 'type-only', 'import'] },
          ],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/beta.ts', [
        {
          resolved: 'src/alpha.ts',
          circular: true,
          dependencyTypes: ['local', 'type-only', 'import'],
          cycle: [
            { name: 'src/alpha.ts', dependencyTypes: ['local', 'type-only', 'import'] },
            { name: 'src/beta.ts', dependencyTypes: ['local', 'type-only', 'import'] },
          ],
        } as IModule['dependencies'][0],
      ]),
    ];

    expect(collectDistinctCycles(modules)).toEqual([{ paths: ['src/beta.ts', 'src/alpha.ts'] }]);
  });

  it('dedupes rotations of the same three-module cycle', () => {
    const modules = [
      moduleAt('src/one.ts', [
        {
          resolved: 'src/two.ts',
          circular: true,
          cycle: [
            { name: 'src/two.ts', dependencyTypes: ['local'] },
            { name: 'src/three.ts', dependencyTypes: ['local'] },
            { name: 'src/one.ts', dependencyTypes: ['local'] },
          ],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/two.ts', [
        {
          resolved: 'src/three.ts',
          circular: true,
          cycle: [
            { name: 'src/three.ts', dependencyTypes: ['local'] },
            { name: 'src/one.ts', dependencyTypes: ['local'] },
            { name: 'src/two.ts', dependencyTypes: ['local'] },
          ],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/three.ts', [
        {
          resolved: 'src/one.ts',
          circular: true,
          cycle: [
            { name: 'src/one.ts', dependencyTypes: ['local'] },
            { name: 'src/two.ts', dependencyTypes: ['local'] },
            { name: 'src/three.ts', dependencyTypes: ['local'] },
          ],
        } as IModule['dependencies'][0],
      ]),
    ];

    expect(collectDistinctCycles(modules)).toHaveLength(1);
    expect(collectDistinctCycles(modules)[0]!.paths).toEqual(['src/two.ts', 'src/three.ts', 'src/one.ts']);
  });

  it('keeps distinct cycles separate', () => {
    const modules = [
      moduleAt('src/a.ts', [
        {
          resolved: 'src/b.ts',
          circular: true,
          cycle: [
            { name: 'src/b.ts', dependencyTypes: ['local'] },
            { name: 'src/a.ts', dependencyTypes: ['local'] },
          ],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/c.ts', [
        {
          resolved: 'src/d.ts',
          circular: true,
          cycle: [
            { name: 'src/d.ts', dependencyTypes: ['local'] },
            { name: 'src/c.ts', dependencyTypes: ['local'] },
          ],
        } as IModule['dependencies'][0],
      ]),
    ];

    expect(collectDistinctCycles(modules)).toHaveLength(2);
  });
});
