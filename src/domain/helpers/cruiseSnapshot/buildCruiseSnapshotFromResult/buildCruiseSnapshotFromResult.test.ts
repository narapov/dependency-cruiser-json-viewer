import type { ICruiseResult, IModule, ISummary } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { getCruiseSources } from '../getCruiseSources';
import { buildCruiseSnapshotFromResult } from './buildCruiseSnapshotFromResult';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function circularDep(resolved: string, cycleNames: string[]): IModule['dependencies'][0] {
  return {
    resolved,
    circular: true,
    cycle: cycleNames.map(name => ({ name, dependencyTypes: ['local'] })),
  } as IModule['dependencies'][0];
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

describe('buildCruiseSnapshotFromResult', () => {
  it('marks no members ignored when ignore patterns are empty', () => {
    const result = cruiseResult([
      moduleAt('src/a.ts', [circularDep('src/b.ts', ['src/b.ts', 'src/a.ts'])]),
      moduleAt('src/b.ts', [circularDep('src/a.ts', ['src/a.ts', 'src/b.ts'])]),
    ]);

    const snapshot = buildCruiseSnapshotFromResult(result, []);

    expect(getCruiseSources(snapshot).sort()).toEqual(['src/a.ts', 'src/b.ts']);
    expect(snapshot.cycles).toEqual([
      {
        members: [
          { path: 'src/b.ts', ignored: false },
          { path: 'src/a.ts', ignored: false },
        ],
      },
    ]);
  });

  it('keeps partial-ignore cycle members with ignored annotation', () => {
    const result = cruiseResult([
      moduleAt('src/a.ts', [circularDep('src/b.ts', ['src/b.ts', 'src/c.ts', 'src/d.ts', 'src/a.ts'])]),
      moduleAt('src/b.ts', [circularDep('src/c.ts', ['src/c.ts', 'src/d.ts', 'src/a.ts', 'src/b.ts'])]),
      moduleAt('src/c.ts', [circularDep('src/d.ts', ['src/d.ts', 'src/a.ts', 'src/b.ts', 'src/c.ts'])]),
      moduleAt('src/d.ts', [circularDep('src/a.ts', ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'])]),
    ]);

    const snapshot = buildCruiseSnapshotFromResult(result, ['**/b.ts']);

    expect(getCruiseSources(snapshot).sort()).toEqual(['src/a.ts', 'src/c.ts', 'src/d.ts']);
    expect(snapshot.cycles).toHaveLength(1);
    expect(snapshot.cycles[0]!.members).toEqual([
      { path: 'src/b.ts', ignored: true },
      { path: 'src/c.ts', ignored: false },
      { path: 'src/d.ts', ignored: false },
      { path: 'src/a.ts', ignored: false },
    ]);
  });

  it('retains fully ignored cycles with every member marked ignored', () => {
    const result = cruiseResult([
      moduleAt('src/keep.ts'),
      moduleAt('src/ignored/x.ts', [circularDep('src/ignored/y.ts', ['src/ignored/y.ts', 'src/ignored/x.ts'])]),
      moduleAt('src/ignored/y.ts', [circularDep('src/ignored/x.ts', ['src/ignored/x.ts', 'src/ignored/y.ts'])]),
    ]);

    const snapshot = buildCruiseSnapshotFromResult(result, ['src/ignored/**']);

    expect(getCruiseSources(snapshot)).toEqual(['src/keep.ts']);
    expect(snapshot.cycles).toEqual([
      {
        members: [
          { path: 'src/ignored/y.ts', ignored: true },
          { path: 'src/ignored/x.ts', ignored: true },
        ],
      },
    ]);
  });
});
