import { describe, expect, it } from 'vitest';

import { BUILT_IN_PREFIX, BUILT_IN_ROOT } from '../isBuiltInPath';
import { toBuiltInLeafName, toBuiltInSnapshotPath } from './toBuiltInSnapshotPath';

describe('toBuiltInLeafName', () => {
  it('uses bare id when protocol is unset', () => {
    expect(toBuiltInLeafName('crypto')).toBe('crypto');
    expect(toBuiltInLeafName('path/posix')).toBe('path/posix');
  });

  it('prefixes protocol when set', () => {
    expect(toBuiltInLeafName('fs', 'node:')).toBe('node:fs');
    expect(toBuiltInLeafName('path/posix', 'node:')).toBe('node:path/posix');
    expect(toBuiltInLeafName('fs', 'bun:')).toBe('bun:fs');
  });
});

describe('toBuiltInSnapshotPath', () => {
  it('builds paths under :buildIn:', () => {
    expect(toBuiltInSnapshotPath('crypto')).toBe(`${BUILT_IN_PREFIX}crypto`);
    expect(toBuiltInSnapshotPath('fs', 'node:')).toBe(`${BUILT_IN_PREFIX}node:fs`);
    expect(toBuiltInSnapshotPath('path/posix', 'node:')).toBe(`${BUILT_IN_PREFIX}node:path/posix`);
    expect(toBuiltInSnapshotPath('fs', 'bun:')).toBe(`${BUILT_IN_PREFIX}bun:fs`);
  });

  it('is idempotent for already-prefixed paths and the root', () => {
    expect(toBuiltInSnapshotPath(`${BUILT_IN_PREFIX}node:fs`)).toBe(`${BUILT_IN_PREFIX}node:fs`);
    expect(toBuiltInSnapshotPath(BUILT_IN_ROOT)).toBe(BUILT_IN_ROOT);
  });
});
