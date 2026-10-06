import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { makeDependencyKey } from '../../dependencyKey';
import { buildModulesDependencies } from './buildModulesDependencies';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('buildModulesDependencies', () => {
  it('maps resolved deps by makeDependencyKey and skips unresolved', () => {
    const { modulesDependenciesByDependencyKey: map } = buildModulesDependencies([
      moduleAt('src/a.ts', [
        { resolved: 'src/b.ts', circular: false } as IModule['dependencies'][number],
        { resolved: '', circular: false } as IModule['dependencies'][number],
        { circular: false } as IModule['dependencies'][number],
      ]),
      moduleAt('src/b.ts'),
    ]);

    expect(map.size).toBe(1);
    const key = makeDependencyKey('src/a.ts', 'src/b.ts');
    expect(map.get(key)).toEqual([
      expect.objectContaining({ id: key, source: 'src/a.ts', target: 'src/b.ts', resolved: 'src/b.ts' }),
    ]);
  });

  it('keeps multiple records for the same source→target pair', () => {
    const { modulesDependenciesByDependencyKey: map } = buildModulesDependencies([
      moduleAt('src/a.ts', [
        {
          resolved: 'pkg',
          dependencyTypes: ['type-import'],
        } as IModule['dependencies'][number],
        {
          resolved: 'pkg',
          dependencyTypes: ['import'],
        } as IModule['dependencies'][number],
      ]),
    ]);

    expect(map.get(makeDependencyKey('src/a.ts', 'pkg'))).toHaveLength(2);
  });

  it('rewrites coreModule targets under :buildIn: with protocol leaf names', () => {
    const { modulesDependenciesByDependencyKey: byKey, modulesDependenciesByTarget: byTarget } =
      buildModulesDependencies([
        moduleAt('src/a.ts', [
          {
            resolved: 'fs',
            coreModule: true,
            dependencyTypes: ['core', 'import'],
          } as IModule['dependencies'][number],
          {
            resolved: 'fs',
            coreModule: true,
            protocol: 'node:',
            dependencyTypes: ['core', 'import'],
          } as IModule['dependencies'][number],
        ]),
        { ...moduleAt('fs'), coreModule: true } as IModule,
      ]);

    const bareKey = makeDependencyKey('src/a.ts', ':buildIn:/fs');
    const nodeKey = makeDependencyKey('src/a.ts', ':buildIn:/node:fs');

    expect(byKey.get(bareKey)?.[0]).toEqual(
      expect.objectContaining({ target: ':buildIn:/fs', resolved: ':buildIn:/fs' }),
    );
    expect(byKey.get(nodeKey)?.[0]).toEqual(
      expect.objectContaining({ target: ':buildIn:/node:fs', resolved: ':buildIn:/node:fs' }),
    );
    expect(
      byTarget
        .get(':buildIn:')
        ?.map(dep => dep.target)
        .sort(),
    ).toEqual([':buildIn:/fs', ':buildIn:/node:fs']);
    expect(byTarget.has('fs')).toBe(false);
  });
});
