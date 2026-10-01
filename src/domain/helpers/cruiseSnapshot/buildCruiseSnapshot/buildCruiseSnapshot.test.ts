import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { makeDependencyKey } from '../../dependencyKey';
import { getCruiseSources } from '../getCruiseSources';
import { buildCruiseSnapshot } from './buildCruiseSnapshot';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('buildCruiseSnapshot', () => {
  it('builds folder structure with ancestors nearest-parent-first', () => {
    const snapshot = buildCruiseSnapshot([moduleAt('src/a/b/c.ts'), moduleAt('src/a/d.ts')]);

    const file = snapshot.nodes.get('src/a/b/c.ts');
    expect(file).toMatchObject({
      path: 'src/a/b/c.ts',
      isFolder: false,
      ancestors: ['src/a/b', 'src/a', 'src'],
      parent: 'src/a/b',
    });
    expect(file?.descendantFiles.size).toBe(0);

    const folder = snapshot.nodes.get('src/a');
    expect(folder).toMatchObject({
      isFolder: true,
      parent: 'src',
    });
    expect([...folder!.children.keys()].sort()).toEqual(['src/a/b', 'src/a/d.ts']);
    expect([...folder!.descendantFiles].sort()).toEqual(['src/a/b/c.ts', 'src/a/d.ts']);

    expect([...snapshot.tree.keys()]).toEqual(['src']);
    expect(getCruiseSources(snapshot).sort()).toEqual(['src/a/b/c.ts', 'src/a/d.ts']);
    expect(snapshot.tree.get('src')?.children.get('src/a')?.children.get('src/a/b')?.children.has('src/a/b/c.ts')).toBe(
      true,
    );
  });

  it('indexes file node external deps and dependents by dependency id', () => {
    const modules = [
      moduleAt('src/a.ts', [{ resolved: 'src/b.ts', dependencyTypes: ['local'] } as IModule['dependencies'][0]]),
      moduleAt('src/b.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    const depKey = makeDependencyKey('src/a.ts', 'src/b.ts');

    const aDeps = snapshot.nodes.get('src/a.ts')?.externalDependencies.get(depKey);
    const bDependents = snapshot.nodes.get('src/b.ts')?.externalDependents.get(depKey);
    expect(aDeps?.[0]?.id).toBe(depKey);
    expect(bDependents?.[0]?.id).toBe(depKey);
    expect(aDeps?.[0]).toEqual(bDependents?.[0]);
  });

  it('rolls external folder dependencies and dependents', () => {
    const modules = [
      moduleAt('src/domain/a.ts', [
        { resolved: 'src/App/b.ts', dependencyTypes: ['local'] } as IModule['dependencies'][0],
      ]),
      moduleAt('src/App/b.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);

    const domainExternal = [...(snapshot.nodes.get('src/domain')?.externalDependencies.values() ?? [])];
    expect(domainExternal.some(bucket => bucket[0]?.target === 'src/App/b.ts')).toBe(true);

    const appExternalDependents = [...(snapshot.nodes.get('src/App')?.externalDependents.values() ?? [])];
    expect(appExternalDependents.some(bucket => bucket[0]?.source === 'src/domain/a.ts')).toBe(true);
  });

  it('does not put circularPaths on file nodes; folder circularity is via descendant deps', () => {
    const modules = [
      moduleAt('src/a.ts', [
        { resolved: 'src/b.ts', circular: true, dependencyTypes: ['local'] } as IModule['dependencies'][0],
      ]),
      moduleAt('src/b.ts', [
        { resolved: 'src/a.ts', circular: true, dependencyTypes: ['local'] } as IModule['dependencies'][0],
      ]),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    expect(snapshot.nodes.get('src/a.ts')?.isFolder).toBe(false);
    expect(
      [...(snapshot.nodes.get('src/a.ts')?.externalDependencies.values() ?? [])].some(bucket =>
        bucket.some(dep => dep.circular),
      ),
    ).toBe(true);
  });

  it('attaches applicableRules, global rules, and indexes violations by dependency key', () => {
    const ruleSet: IFlattenedRuleSet = {
      forbidden: [
        {
          name: 'no-circular',
          severity: 'warn',
          from: {},
          to: { circular: true },
        },
        {
          name: 'domain-only-domain',
          severity: 'error',
          from: { path: '^src/domain' },
          to: { pathNot: '^src/domain' },
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

    const snapshot = buildCruiseSnapshot(
      [moduleAt('src/domain/a.ts'), moduleAt('src/App/leak.ts')],
      ruleSet,
      violations,
    );

    const fileRules = snapshot.nodes.get('src/domain/a.ts')?.applicableRules.map(entry => entry.name);
    expect(fileRules).toEqual(['no-circular', 'domain-only-domain']);

    const folderRules = snapshot.nodes.get('src/domain')?.applicableRules;
    expect(folderRules?.map(entry => entry.name)).toEqual(['no-circular', 'domain-only-domain']);
    expect(folderRules?.find(entry => entry.name === 'domain-only-domain')?.violations).toHaveLength(1);
    expect(snapshot.ruleSetUsed).toBe(ruleSet);
    expect(snapshot.violations.get(makeDependencyKey('src/domain/a.ts', 'src/App/App.tsx'))).toEqual(violations);
    expect(snapshot.rules.map(entry => entry.name)).toEqual(['no-circular', 'domain-only-domain']);
    expect(snapshot.rules.find(entry => entry.name === 'no-circular')?.violations).toHaveLength(0);
    expect(snapshot.rules.find(entry => entry.name === 'domain-only-domain')?.violations).toEqual(violations);
  });

  it('scopes violations and rules to snapshot module from paths and keeps orphan names', () => {
    const ruleSet: IFlattenedRuleSet = {
      forbidden: [
        {
          name: 'domain-only-domain',
          severity: 'error',
          from: { path: '^src/domain' },
          to: { pathNot: '^src/domain' },
        },
      ],
    };

    const keptViolation: IViolation = {
      type: 'dependency',
      rule: { name: 'domain-only-domain', severity: 'error' },
      from: 'src/domain/a.ts',
      to: 'src/App/App.tsx',
    };
    const droppedViolation: IViolation = {
      type: 'dependency',
      rule: { name: 'domain-only-domain', severity: 'error' },
      from: 'src/ignored/x.ts',
      to: 'src/App/App.tsx',
    };
    const orphanViolation: IViolation = {
      type: 'dependency',
      rule: { name: 'ghost-rule', severity: 'warn' },
      from: 'src/domain/a.ts',
      to: 'src/domain/b.ts',
    };

    const snapshot = buildCruiseSnapshot([moduleAt('src/domain/a.ts'), moduleAt('src/domain/b.ts')], ruleSet, [
      keptViolation,
      droppedViolation,
      orphanViolation,
    ]);

    expect(snapshot.violations.size).toBe(2);
    expect(snapshot.violations.get(makeDependencyKey('src/ignored/x.ts', 'src/App/App.tsx'))).toBeUndefined();
    expect(snapshot.rules.map(entry => entry.name)).toEqual(['domain-only-domain', 'ghost-rule']);
    expect(snapshot.rules.find(entry => entry.name === 'domain-only-domain')?.violations).toEqual([keptViolation]);
    expect(snapshot.rules.find(entry => entry.name === 'ghost-rule')?.rule).toBeNull();
    expect(snapshot.rules.find(entry => entry.name === 'ghost-rule')?.violations).toEqual([orphanViolation]);
    expect(
      snapshot.nodes.get('src/domain/a.ts')?.applicableRules.find(entry => entry.name === 'domain-only-domain')
        ?.violations,
    ).toEqual([keptViolation]);
  });

  it('returns an empty snapshot for no modules', () => {
    const snapshot = buildCruiseSnapshot([]);
    expect(snapshot.nodes.size).toBe(0);
    expect(snapshot.tree.size).toBe(0);
    expect(getCruiseSources(snapshot)).toEqual([]);
    expect(snapshot.cycles).toEqual([]);
    expect(snapshot.rules).toEqual([]);
    expect(snapshot.ruleSetUsed).toBeUndefined();
    expect(snapshot.violations.size).toBe(0);
  });
});
