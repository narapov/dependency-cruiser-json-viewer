import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadTextFile } from './downloadTextFile';

describe('downloadTextFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('creates an object URL and clicks a temporary download anchor', () => {
    vi.useFakeTimers();

    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const createElement = vi.fn(() => ({
      href: '',
      download: '',
      rel: '',
      click,
      remove,
    }));
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.stubGlobal('document', {
      createElement,
      body: { appendChild },
    });

    downloadTextFile('graph.dot', 'digraph {}', 'text/vnd.graphviz');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElement).toHaveBeenCalledWith('a');
    const anchor = createElement.mock.results[0]?.value as {
      href: string;
      download: string;
      rel: string;
    };
    expect(anchor.href).toBe('blob:mock');
    expect(anchor.download).toBe('graph.dot');
    expect(anchor.rel).toBe('noopener');
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
