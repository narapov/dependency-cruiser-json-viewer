// @vitest-environment jsdom
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, screen } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, pathsToPresenceRecord, useWorkspaceStore } from '../../stores/workspaceStore';
import { FileTree } from './FileTree';
import type { FileTreeHandle } from './types';

const SOURCES = ['src/a.ts', 'src/b/c.ts'];

const CRUISE_TREE = buildCruiseSnapshot(
  SOURCES.map(source => ({ source, dependencies: [], dependents: [], valid: true })),
);

function seedWorkspace(overrides?: { selectedKeys?: string[]; expandedKeys?: string[]; activePath?: string | null }) {
  useWorkspaceStore.setState({
    ...initialWorkspaceState,
    cruiseSnapshot: CRUISE_TREE,
    selectedFilePaths: pathsToPresenceRecord(overrides?.selectedKeys ?? SOURCES),
    expandedFolderPaths: pathsToPresenceRecord(overrides?.expandedKeys ?? ['src', 'src/b']),
    activePath: overrides?.activePath ?? null,
  });
}

describe('FileTree', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.useFakeTimers();
    seedWorkspace();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    useWorkspaceStore.setState({ ...initialWorkspaceState });
  });

  it('debounces item click into onShowInGraph for selected paths', () => {
    const onShowInGraph = vi.fn();

    renderWithTheme(<FileTree onShowInGraph={onShowInGraph} onViewModuleJson={vi.fn()} />);

    fireEvent.click(screen.getByText('a.ts'));
    expect(onShowInGraph).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onShowInGraph).toHaveBeenCalledWith('src/a.ts');
  });

  it('does not show unselected paths in graph on click', () => {
    const onShowInGraph = vi.fn();
    seedWorkspace({ selectedKeys: ['src/a.ts'] });

    renderWithTheme(<FileTree onShowInGraph={onShowInGraph} onViewModuleJson={vi.fn()} />);

    fireEvent.click(screen.getByText('c.ts'));
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onShowInGraph).not.toHaveBeenCalled();
  });

  it('does not show in graph when clicking the checkbox', () => {
    const onShowInGraph = vi.fn();

    renderWithTheme(<FileTree onShowInGraph={onShowInGraph} onViewModuleJson={vi.fn()} />);

    const treeItem = screen.getByText('a.ts').closest('[role="treeitem"]');
    expect(treeItem).toBeInTheDocument();
    fireEvent.click(treeItem!.querySelector('input[type="checkbox"]')!);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onShowInGraph).not.toHaveBeenCalled();
  });

  it('exposes focusPath that scrolls and focuses the item', () => {
    const ref = createRef<FileTreeHandle>();

    renderWithTheme(<FileTree ref={ref} onShowInGraph={vi.fn()} onViewModuleJson={vi.fn()} />);

    act(() => {
      ref.current?.focusPath('src/a.ts');
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('toggles expand via FileTreeItem double-click on folders', () => {
    renderWithTheme(<FileTree onShowInGraph={vi.fn()} onViewModuleJson={vi.fn()} />);

    fireEvent.doubleClick(screen.getByText('b'));

    expect(useWorkspaceStore.getState().expandedFolderPaths).toEqual({ src: true });
  });

  it('shows in graph on Enter for navigable FileTreeItem', () => {
    const onShowInGraph = vi.fn();

    renderWithTheme(<FileTree onShowInGraph={onShowInGraph} onViewModuleJson={vi.fn()} />);

    const treeItem = screen.getByText('a.ts').closest('[role="treeitem"]');
    expect(treeItem).toBeInTheDocument();
    fireEvent.keyDown(treeItem!, { key: 'Enter' });

    expect(onShowInGraph).toHaveBeenCalledWith('src/a.ts');
  });
});
