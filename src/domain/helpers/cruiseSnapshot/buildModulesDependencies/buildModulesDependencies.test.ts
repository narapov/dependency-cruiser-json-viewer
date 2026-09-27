import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { makeDependencyKey } from '../../dependencyKey';
import { buildModulesDependencies } from './buildModulesDependencies';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('buildModulesDependencies', () => {
  it('maps resolved deps by makeDependencyKey and skips unresolved', () => {
    const map = buildModulesDependencies([
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
    const map = buildModulesDependencies([
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
});
