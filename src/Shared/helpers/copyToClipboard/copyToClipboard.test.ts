import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard } from './copyToClipboard';

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes text via navigator.clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyToClipboard('src/a.ts')).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith('src/a.ts');
  });
});
