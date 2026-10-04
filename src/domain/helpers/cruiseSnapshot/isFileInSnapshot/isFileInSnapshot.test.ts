import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../buildCruiseSnapshot';
import { isFileInSnapshot } from './isFileInSnapshot';

function moduleAt(source: string): IModule {
  return { source, dependencies: [], dependents: [], valid: true } as IModule;
}

describe('isFileInSnapshot', () => {
  const snapshot = buildCruiseSnapshot([moduleAt('src/a.ts'), moduleAt('src/b/c.ts')]);

  it('returns true for a file node', () => {
    expect(isFileInSnapshot(snapshot, 'src/a.ts')).toBe(true);
    expect(isFileInSnapshot(snapshot, 'src/b/c.ts')).toBe(true);
  });

  it('returns false for a folder node', () => {
    expect(isFileInSnapshot(snapshot, 'src')).toBe(false);
    expect(isFileInSnapshot(snapshot, 'src/b')).toBe(false);
  });

  it('returns false for a path absent from the snapshot', () => {
    expect(isFileInSnapshot(snapshot, 'src/missing.ts')).toBe(false);
  });
});
