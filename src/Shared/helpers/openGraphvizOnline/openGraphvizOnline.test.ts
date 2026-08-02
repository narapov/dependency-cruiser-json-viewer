import { afterEach, describe, expect, it, vi } from 'vitest';

import { openGraphvizOnline } from './openGraphvizOnline';

describe('openGraphvizOnline', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens Graphviz Online with nop2 engine and DOT in the hash', () => {
    const open = vi.fn();
    vi.stubGlobal('window', { open });

    openGraphvizOnline('digraph { a -> b }');

    expect(open).toHaveBeenCalledWith(
      'https://dreampuf.github.io/GraphvizOnline/?engine=nop2#digraph%20%7B%20a%20-%3E%20b%20%7D',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
