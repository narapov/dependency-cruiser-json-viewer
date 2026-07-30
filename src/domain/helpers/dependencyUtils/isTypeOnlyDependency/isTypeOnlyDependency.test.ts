import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { isTypeOnlyDependency } from './isTypeOnlyDependency';

describe('isTypeOnlyDependency', () => {
  it('returns true when dependencyTypes includes type-only', () => {
    const dep = {
      resolved: 'src/foo.ts',
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];

    expect(isTypeOnlyDependency(dep)).toBe(true);
  });

  it('returns false when dependencyTypes is missing or empty', () => {
    expect(isTypeOnlyDependency({ resolved: 'src/foo.ts' } as IModule['dependencies'][0])).toBe(false);
    expect(
      isTypeOnlyDependency({
        resolved: 'src/foo.ts',
        dependencyTypes: [] as NonNullable<IModule['dependencies'][0]['dependencyTypes']>,
      } as IModule['dependencies'][0]),
    ).toBe(false);
  });

  it('returns false when type-only is not present', () => {
    const dep = {
      resolved: 'src/foo.ts',
      dependencyTypes: ['local', 'import'],
    } as IModule['dependencies'][0];

    expect(isTypeOnlyDependency(dep)).toBe(false);
  });
});
