import { describe, expect, it } from 'vitest';

import { isPathVisibleInSelectionRecord } from './isPathVisibleInSelectionRecord';

describe('isPathVisibleInSelectionRecord', () => {
  it('is true when the path itself is selected', () => {
    expect(isPathVisibleInSelectionRecord('src/foo', { 'src/foo': true }, [])).toBe(true);
  });

  it('is true when a descendant file is selected', () => {
    expect(isPathVisibleInSelectionRecord('src/foo', { 'src/foo/bar/baz.ts': true }, ['src/foo/bar/baz.ts'])).toBe(
      true,
    );
  });

  it('is false when neither path nor descendant files are selected', () => {
    expect(isPathVisibleInSelectionRecord('src/foo', { 'src/other.ts': true }, ['src/foo/a.ts'])).toBe(false);
  });
});
