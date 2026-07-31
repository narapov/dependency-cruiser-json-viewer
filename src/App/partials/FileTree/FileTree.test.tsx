// @vitest-environment jsdom
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { FileTree } from './FileTree';
import type { FileTreeHandle } from './types';

const SOURCES = ['src/a.ts', 'src/b/c.ts'];

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('FileTree', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('debounces item click into onShowInGraph for selected paths', () => {
    const onShowInGraph = vi.fn();
    const onExpand = vi.fn();

    renderWithTheme(
      <FileTree
        sources={SOURCES}
        selectedKeys={SOURCES}
        expandedKeys={['src', 'src/b']}
        onExpand={onExpand}
        onShowInGraph={onShowInGraph}
      />,
    );

    fireEvent.click(screen.getByText('a.ts'));
    expect(onShowInGraph).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onShowInGraph).toHaveBeenCalledWith('src/a.ts');
  });

  it('does not show unselected paths in graph on click', () => {
    const onShowInGraph = vi.fn();

    renderWithTheme(
      <FileTree
        sources={SOURCES}
        selectedKeys={['src/a.ts']}
        expandedKeys={['src', 'src/b']}
        onExpand={vi.fn()}
        onShowInGraph={onShowInGraph}
      />,
    );

    fireEvent.click(screen.getByText('c.ts'));
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onShowInGraph).not.toHaveBeenCalled();
  });

  it('exposes focusPath that scrolls and focuses the item', () => {
    const ref = createRef<FileTreeHandle>();

    renderWithTheme(
      <FileTree
        ref={ref}
        sources={SOURCES}
        selectedKeys={SOURCES}
        expandedKeys={['src', 'src/b']}
        onExpand={vi.fn()}
      />,
    );

    act(() => {
      ref.current?.focusPath('src/a.ts');
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('toggles expand via FileTreeItem double-click on folders', () => {
    const onExpand = vi.fn();

    renderWithTheme(
      <FileTree sources={SOURCES} selectedKeys={SOURCES} expandedKeys={['src', 'src/b']} onExpand={onExpand} />,
    );

    fireEvent.doubleClick(screen.getByText('b'));

    expect(onExpand).toHaveBeenCalledWith(['src']);
  });

  it('shows in graph on Enter for navigable FileTreeItem', () => {
    const onShowInGraph = vi.fn();

    renderWithTheme(
      <FileTree
        sources={SOURCES}
        selectedKeys={SOURCES}
        expandedKeys={['src', 'src/b']}
        onExpand={vi.fn()}
        onShowInGraph={onShowInGraph}
      />,
    );

    const treeItem = screen.getByText('a.ts').closest('[role="treeitem"]');
    expect(treeItem).toBeInTheDocument();
    fireEvent.keyDown(treeItem!, { key: 'Enter' });

    expect(onShowInGraph).toHaveBeenCalledWith('src/a.ts');
  });
});
