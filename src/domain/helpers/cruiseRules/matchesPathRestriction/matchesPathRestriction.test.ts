import { describe, expect, it } from 'vitest';

import { matchesPathRestriction } from './matchesPathRestriction';

describe('matchesPathRestriction', () => {
  it('matches all paths when path and pathNot are omitted', () => {
    expect(matchesPathRestriction('src/a.ts')).toBe(true);
  });

  it('requires path to match when path is set', () => {
    expect(matchesPathRestriction('src/domain/a.ts', '^src/domain/')).toBe(true);
    expect(matchesPathRestriction('src/App/a.ts', '^src/domain/')).toBe(false);
  });

  it('treats path arrays as OR', () => {
    expect(matchesPathRestriction('src/App/a.ts', ['^src/domain/', '^src/App/'])).toBe(true);
    expect(matchesPathRestriction('src/Shared/a.ts', ['^src/domain/', '^src/App/'])).toBe(false);
  });

  it('excludes paths matching pathNot', () => {
    expect(matchesPathRestriction('src/domain/a.ts', '^src/', '^src/domain/')).toBe(false);
    expect(matchesPathRestriction('src/App/a.ts', '^src/', '^src/domain/')).toBe(true);
  });

  it('treats pathNot arrays as OR exclusions', () => {
    expect(matchesPathRestriction('src/App/a.ts', undefined, ['^src/App/', '^src/Shared/'])).toBe(false);
    expect(matchesPathRestriction('src/domain/a.ts', undefined, ['^src/App/', '^src/Shared/'])).toBe(true);
  });
});
