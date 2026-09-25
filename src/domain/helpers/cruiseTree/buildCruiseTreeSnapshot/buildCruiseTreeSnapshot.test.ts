import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseTreeSnapshot } from './buildCruiseTreeSnapshot';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('buildCruiseTreeSnapshot', () => {
  it('builds folder structure with ancestors nearest-parent-first', () => {
    const snapshot = buildCruiseTreeSnapshot([moduleAt('src/a/b/c.ts'), moduleAt('src/a/d.ts')]);

    const file = snapshot.nodes.get('src/a/b/c.ts');
    expect(file).toMatchObject({
      path: 'src/a/b/c.ts',
      name: 'c.ts',
      isFolder: false,
      ancestors: ['src/a/b', 'src/a', 'src'],
      parentPath: 'src/a/b',
      descendantFiles: [],
    });

    const folder = snapshot.nodes.get('src/a');
    expect(folder).toMatchObject({
      isFolder: true,
      name: 'a',
      childPaths: ['src/a/b', 'src/a/d.ts'],
      descendantFiles: ['src/a/b/c.ts', 'src/a/d.ts'],
    });

    expect(snapshot.rootPaths).toEqual(['src']);
    expect(snapshot.descendantFiles).toEqual(['src/a/b/c.ts', 'src/a/d.ts']);
  });

  it('indexes file dependencies and reverse dependents', () => {
    const snapshot = buildCruiseTreeSnapshot([
      moduleAt('src/a.ts', [{ resolved: 'src/b.ts', circular: false } as IModule['dependencies'][number]]),
      moduleAt('src/b.ts'),
    ]);

    expect(snapshot.nodes.get('src/a.ts')?.dependencies).toEqual([
      { path: 'src/b.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
    ]);
    expect(snapshot.nodes.get('src/b.ts')?.dependents).toEqual([
      { path: 'src/a.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
    ]);
  });

  it('aggregates folder leave and enter edges', () => {
    const snapshot = buildCruiseTreeSnapshot([
      moduleAt('src/domain/a.ts', [{ resolved: 'src/App/b.ts', circular: false } as IModule['dependencies'][number]]),
      moduleAt('src/App/b.ts'),
    ]);

    const domainDeps = snapshot.nodes.get('src/domain')?.dependencies ?? [];
    expect(domainDeps.some(edge => edge.path === 'src/App/b.ts')).toBe(true);

    const appDependents = snapshot.nodes.get('src/App')?.dependents ?? [];
    expect(appDependents.some(edge => edge.path === 'src/domain/a.ts')).toBe(true);
  });

  it('rolls circular paths up to folders and collects cycles', () => {
    const dep = {
      resolved: 'src/b.ts',
      circular: true,
      cycle: [{ name: 'src/a.ts' }, { name: 'src/b.ts' }],
    } as IModule['dependencies'][number];

    const snapshot = buildCruiseTreeSnapshot([moduleAt('src/a.ts', [dep]), moduleAt('src/b.ts')]);

    expect(snapshot.nodes.get('src/a.ts')?.circularPaths).toEqual([]);
    expect(snapshot.nodes.get('src')?.circularPaths).toEqual(['src/a.ts', 'src/b.ts']);
    expect(snapshot.cycles).toEqual([{ paths: ['src/a.ts', 'src/b.ts'] }]);
  });

  it('attaches applicable rules for files and unions them for folders', () => {
    const ruleSet: IFlattenedRuleSet = {
      forbidden: [
        {
          name: 'no-circular',
          severity: 'error',
          from: {},
          to: { circular: true },
        },
        {
          name: 'domain-only-domain',
          severity: 'error',
          from: { path: '^src/domain/' },
          to: { pathNot: '^src/domain/' },
        },
        {
          name: 'app-only',
          severity: 'error',
          from: { path: '^src/App/' },
          to: { pathNot: '^src/App/' },
        },
      ],
    };

    const violations: IViolation[] = [
      {
        type: 'dependency',
        rule: { name: 'domain-only-domain', severity: 'error' },
        from: 'src/domain/a.ts',
        to: 'src/App/App.tsx',
      },
    ];

    const snapshot = buildCruiseTreeSnapshot(
      [moduleAt('src/domain/a.ts'), moduleAt('src/App/leak.ts')],
      ruleSet,
      violations,
    );

    const fileRules = snapshot.nodes.get('src/domain/a.ts')?.applicableRules.map(entry => entry.name);
    expect(fileRules).toEqual(['no-circular', 'domain-only-domain']);

    const folderRules = snapshot.nodes.get('src/domain')?.applicableRules;
    expect(folderRules?.map(entry => entry.name)).toEqual(['no-circular', 'domain-only-domain']);
    expect(folderRules?.find(entry => entry.name === 'domain-only-domain')?.violations).toHaveLength(1);
  });

  it('returns an empty snapshot for no modules', () => {
    const snapshot = buildCruiseTreeSnapshot([]);
    expect(snapshot.nodes.size).toBe(0);
    expect(snapshot.rootPaths).toEqual([]);
    expect(snapshot.descendantFiles).toEqual([]);
    expect(snapshot.cycles).toEqual([]);
  });
});
