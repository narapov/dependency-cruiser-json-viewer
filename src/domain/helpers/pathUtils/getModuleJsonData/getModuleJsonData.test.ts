import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { getModuleJsonData } from './getModuleJsonData';

function moduleAt(source: string): IModule {
  return { source, dependencies: [], dependents: [], valid: true } as IModule;
}

describe('getModuleJsonData', () => {
  const modules = [
    moduleAt('src/foo/a.ts'),
    moduleAt('src/foo/bar/b.ts'),
    moduleAt('src/other/c.ts'),
    moduleAt('lib/y.ts'),
  ];

  it('returns the module for a file path', () => {
    expect(getModuleJsonData('src/foo/a.ts', modules)).toEqual(modules[0]);
  });

  it('returns all nested modules for a folder path', () => {
    expect(getModuleJsonData('src/foo', modules)).toEqual([modules[0], modules[1]]);
  });

  it('returns null when the path matches nothing', () => {
    expect(getModuleJsonData('src/missing', modules)).toBeNull();
  });
});
