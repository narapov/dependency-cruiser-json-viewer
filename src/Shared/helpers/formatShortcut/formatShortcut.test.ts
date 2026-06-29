import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatShortcut } from './formatShortcut';

describe('formatShortcut', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses Cmd symbol on Mac', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    expect(formatShortcut('P')).toBe('⌘P');
  });

  it('uses Ctrl prefix on non-Mac', () => {
    vi.stubGlobal('navigator', { platform: 'Win32' });
    expect(formatShortcut('P')).toBe('Ctrl+P');
  });
});
