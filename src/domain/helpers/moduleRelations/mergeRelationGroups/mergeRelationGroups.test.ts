import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import type { DependencyRelationFlags } from '../../dependencyUtils';
import { buildFolderSet, flagsMapToSortedRelations, mergeRelation } from './mergeRelationGroups';

type ModuleDep = IModule['dependencies'][number];

function dep(partial: Partial<ModuleDep> & { resolved: string }): ModuleDep {
  return partial as ModuleDep;
}

describe('buildFolderSet', () => {
  it('collects ancestor folders for sources', () => {
    expect(buildFolderSet(['src/foo/a.ts', 'lib/b.ts'])).toEqual(new Set(['src/foo', 'src', 'lib']));
  });
});

describe('mergeRelation / flagsMapToSortedRelations', () => {
  it('builds sorted flat relations', () => {
    const map = new Map<string, DependencyRelationFlags>();
    mergeRelation(map, 'src/b.ts', dep({ resolved: 'src/b.ts' }));
    mergeRelation(map, 'src/a.ts', dep({ resolved: 'src/a.ts', circular: true }));

    expect(flagsMapToSortedRelations(map)).toEqual([
      { path: 'src/a.ts', circular: true, typeOnly: false, typeOnlyCircular: false },
      { path: 'src/b.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
    ]);
  });

  it('merges type-only and circular flags on the same path', () => {
    const map = new Map<string, DependencyRelationFlags>();
    mergeRelation(map, 'src/a.ts', dep({ resolved: 'src/a.ts', dependencyTypes: ['local', 'type-only', 'import'] }));
    mergeRelation(map, 'src/a.ts', dep({ resolved: 'src/a.ts', circular: true, dependencyTypes: ['local', 'import'] }));

    expect(flagsMapToSortedRelations(map)).toEqual([
      { path: 'src/a.ts', circular: true, typeOnly: false, typeOnlyCircular: false },
    ]);
  });
});
