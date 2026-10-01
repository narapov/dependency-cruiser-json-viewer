import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { collectDistinctCycles } from './collectDistinctCycles';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true };
}

function circularDep(resolved: string, cycleNames: string[]): IModule['dependencies'][0] {
  return {
    resolved,
    circular: true,
    cycle: cycleNames.map(name => ({ name, dependencyTypes: ['local'] })),
  } as IModule['dependencies'][0];
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

    expect(collectDistinctCycles(modules)).toEqual([
      {
        members: [
          { path: 'src/beta.ts', ignored: false },
          { path: 'src/alpha.ts', ignored: false },
        ],
      },
    ]);
  });

  it('dedupes rotations of the same three-module cycle', () => {
    const modules = [
      moduleAt('src/one.ts', [circularDep('src/two.ts', ['src/two.ts', 'src/three.ts', 'src/one.ts'])]),
      moduleAt('src/two.ts', [circularDep('src/three.ts', ['src/three.ts', 'src/one.ts', 'src/two.ts'])]),
      moduleAt('src/three.ts', [circularDep('src/one.ts', ['src/one.ts', 'src/two.ts', 'src/three.ts'])]),
    ];

    expect(collectDistinctCycles(modules)).toHaveLength(1);
    expect(collectDistinctCycles(modules)[0]!.members).toEqual([
      { path: 'src/two.ts', ignored: false },
      { path: 'src/three.ts', ignored: false },
      { path: 'src/one.ts', ignored: false },
    ]);
  });

  it('keeps distinct cycles separate', () => {
    const modules = [
      moduleAt('src/a.ts', [circularDep('src/b.ts', ['src/b.ts', 'src/a.ts'])]),
      moduleAt('src/c.ts', [circularDep('src/d.ts', ['src/d.ts', 'src/c.ts'])]),
    ];

    expect(collectDistinctCycles(modules)).toHaveLength(2);
  });

  it('marks members outside presentSources as ignored', () => {
    const modules = [
      moduleAt('src/a.ts', [circularDep('src/b.ts', ['src/b.ts', 'src/c.ts', 'src/d.ts', 'src/a.ts'])]),
      moduleAt('src/c.ts', [circularDep('src/d.ts', ['src/d.ts', 'src/a.ts', 'src/b.ts', 'src/c.ts'])]),
      moduleAt('src/d.ts', [circularDep('src/a.ts', ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'])]),
      moduleAt('src/b.ts', [circularDep('src/c.ts', ['src/c.ts', 'src/d.ts', 'src/a.ts', 'src/b.ts'])]),
    ];

    const present = new Set(['src/a.ts', 'src/c.ts', 'src/d.ts']);
    const cycles = collectDistinctCycles(modules, present);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]!.members).toEqual([
      { path: 'src/b.ts', ignored: true },
      { path: 'src/c.ts', ignored: false },
      { path: 'src/d.ts', ignored: false },
      { path: 'src/a.ts', ignored: false },
    ]);
  });

  it('marks every member ignored when presentSources is empty', () => {
    const modules = [
      moduleAt('src/x.ts', [circularDep('src/y.ts', ['src/y.ts', 'src/x.ts'])]),
      moduleAt('src/y.ts', [circularDep('src/x.ts', ['src/x.ts', 'src/y.ts'])]),
    ];

    const cycles = collectDistinctCycles(modules, new Set());

    expect(cycles).toEqual([
      {
        members: [
          { path: 'src/y.ts', ignored: true },
          { path: 'src/x.ts', ignored: true },
        ],
      },
    ]);
  });
});
