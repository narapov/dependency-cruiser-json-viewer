// @vitest-environment jsdom
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { LANGUAGE_STORAGE_KEY } from '@/i18n';
import { APP_STORAGE_PREFIX, copyToClipboard, downloadTextFile, THEME_STORAGE_KEY } from '@/Shared';

import type { DependencyGraphHandle } from '../../partials/DependencyGraph';
import type { FileTreeHandle } from '../../partials/FileTree';
import { useAppOrchestration } from './useAppOrchestration';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
    downloadTextFile: vi.fn(),
  };
});

const SOURCES = ['src/a.ts', 'src/b/c.ts', 'src/b/d.ts', 'src/e/f/g.ts'];

function createRefs() {
  const fileTreeRef = createRef<FileTreeHandle | null>();
  const graphRef = createRef<DependencyGraphHandle | null>();
  const fileTree = {
    focusPath: vi.fn(),
  };
  const graph = {
    focusNode: vi.fn(),
    clearAllHighlights: vi.fn(),
    exportDot: vi.fn(),
    openDotOnline: vi.fn(),
    getLayoutState: vi.fn(() => ({ autoLayoutOnly: true, nodePositions: {} })),
    setLayoutState: vi.fn(),
  };
  // refs are mutable in tests
  (fileTreeRef as { current: FileTreeHandle }).current = fileTree as unknown as FileTreeHandle;
  (graphRef as { current: DependencyGraphHandle }).current = graph as unknown as DependencyGraphHandle;
  return { fileTreeRef, graphRef, fileTree, graph };
}

function renderOrchestration(
  overrides: Partial<{
    sources: string[];
    selectedKeys: string[];
    expandedKeys: string[];
  }> = {},
) {
  const refs = createRefs();
  const initialDependencyCruiserState = {
    selectedKeys: overrides.selectedKeys ?? SOURCES,
    expandedKeys: overrides.expandedKeys ?? ['src', 'src/b'],
  };
  const hook = renderHook(
    ({ sources, initialDependencyCruiserState: initial }) =>
      useAppOrchestration({
        sources,
        unfilteredCruiseResult: {
          modules: (overrides.sources ?? SOURCES).map(source => ({
            source,
            dependencies: [],
            dependents: [],
            valid: true,
          })),
          summary: {},
        } as never,
        ignorePatterns: [],
        fileTreeRef: refs.fileTreeRef,
        graphRef: refs.graphRef,
        initialDependencyCruiserState: initial,
        cruiseLoadId: 0,
      }),
    {
      initialProps: {
        sources: overrides.sources ?? SOURCES,
        initialDependencyCruiserState,
      },
    },
  );
  return { ...hook, ...refs, initialDependencyCruiserState };
}

describe('useAppOrchestration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes from dependency cruiser state', () => {
    const { result } = renderOrchestration({
      selectedKeys: ['src/a.ts'],
      expandedKeys: ['src'],
    });

    expect(result.current.selectedPaths).toEqual(['src/a.ts']);
    expect(result.current.expandedKeys).toEqual(['src']);
    expect(result.current.activePath).toBeNull();
    expect(result.current.panelOpen).toBe(false);
  });

  it('resets selection when sources change', () => {
    const { result, rerender } = renderOrchestration({
      selectedKeys: ['src/a.ts'],
      expandedKeys: ['src'],
    });

    act(() => {
      result.current.setSelectedPaths(['src/a.ts']);
    });

    rerender({
      sources: ['src/b/c.ts'],
      initialDependencyCruiserState: {
        selectedKeys: ['src/b/c.ts'],
        expandedKeys: ['src', 'src/b'],
      },
    });

    expect(result.current.selectedPaths).toEqual(['src/b/c.ts']);
    expect(result.current.expandedKeys).toEqual(['src', 'src/b']);
  });

  it('activatePath expands ancestors and sets activePath', () => {
    const { result } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.activatePath('src/b/c.ts');
    });

    expect(result.current.activePath).toBe('src/b/c.ts');
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b']));
  });

  it('showInGraph and showInFileTree focus refs', () => {
    const { result, graph, fileTree } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.showInGraph('src/a.ts');
    });
    expect(graph.focusNode).toHaveBeenCalledWith('src/a.ts');
    expect(result.current.activePath).toBe('src/a.ts');

    act(() => {
      result.current.showInFileTree('src/b/c.ts');
    });
    expect(fileTree.focusPath).toHaveBeenCalledWith('src/b/c.ts');
    expect(result.current.activePath).toBe('src/b/c.ts');
  });

  it('toggleFolder expands and collapses a folder', () => {
    const { result } = renderOrchestration({ expandedKeys: ['src'] });

    act(() => {
      result.current.toggleFolder('src/b');
    });
    expect(result.current.expandedKeys).toContain('src/b');

    act(() => {
      result.current.toggleFolder('src/b');
    });
    expect(result.current.expandedKeys).not.toContain('src/b');
  });

  it('expandRecursive adds subtree folder keys', () => {
    const { result } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.expandRecursive('src');
    });

    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b', 'src/e', 'src/e/f']));
  });

  it('opens and closes dependencies panel', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.handleShowDependencies('src/a.ts');
    });
    expect(result.current.dependenciesPath).toBe('src/a.ts');
    expect(result.current.panelOpen).toBe(true);

    act(() => {
      result.current.handleClosePanel();
    });
    expect(result.current.dependenciesPath).toBeNull();
    expect(result.current.panelOpen).toBe(false);
  });

  it('resolves activePath to null when path leaves sources', () => {
    const { result, rerender } = renderOrchestration();

    act(() => {
      result.current.activatePath('src/a.ts');
    });
    expect(result.current.activePath).toBe('src/a.ts');

    rerender({
      sources: ['src/b/c.ts'],
      initialDependencyCruiserState: {
        selectedKeys: ['src/b/c.ts'],
        expandedKeys: ['src', 'src/b'],
      },
    });

    expect(result.current.activePath).toBeNull();
  });

  it('handleQuickPickSelect activates and focuses immediately', () => {
    const { result, graph, fileTree } = renderOrchestration({
      selectedKeys: SOURCES,
      expandedKeys: [],
    });

    act(() => {
      result.current.handleQuickPickSelect('src/a.ts');
    });

    expect(result.current.activePath).toBe('src/a.ts');
    expect(graph.focusNode).toHaveBeenCalledWith('src/a.ts');
    expect(fileTree.focusPath).toHaveBeenCalledWith('src/a.ts');
  });

  it('selectAll and unselectAll update selectedPaths', () => {
    const { result } = renderOrchestration({ selectedKeys: [] });

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.selectedPaths.length).toBeGreaterThan(0);
    expect(result.current.selectedPaths).toEqual(expect.arrayContaining(SOURCES));

    act(() => {
      result.current.unselectAll();
    });
    expect(result.current.selectedPaths).toEqual([]);
  });

  it('expandAllRecursive and collapseAllRecursive update expandedKeys', () => {
    const { result } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.expandAllRecursive();
    });
    expect(result.current.expandedKeys.length).toBeGreaterThan(0);

    act(() => {
      result.current.collapseAllRecursive();
    });
    expect(result.current.expandedKeys).toEqual([]);
  });

  it('expandActive / collapseActive operate on active folder', () => {
    const { result } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.activatePath('src/b/c.ts');
    });

    act(() => {
      result.current.collapseActive();
    });
    expect(result.current.expandedKeys).not.toContain('src/b');

    act(() => {
      result.current.expandActive();
    });
    expect(result.current.expandedKeys).toContain('src/b');
  });

  it('expandActiveRecursive and collapseActiveRecursive operate on subtree', () => {
    const { result } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.activatePath('src/e/f/g.ts');
    });

    act(() => {
      result.current.expandActiveRecursive();
    });
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src/e', 'src/e/f']));

    act(() => {
      result.current.collapseActiveRecursive();
    });
    expect(result.current.expandedKeys).not.toContain('src/e/f');
  });

  it('copyActive copies resolved active path', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.copyActive();
    });
    expect(copyToClipboard).not.toHaveBeenCalled();

    act(() => {
      result.current.activatePath('src/a.ts');
    });
    act(() => {
      result.current.copyActive();
    });
    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');
  });

  it('viewActiveDependencies opens panel for active path', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.activatePath('src/a.ts');
    });
    act(() => {
      result.current.viewActiveDependencies();
    });

    expect(result.current.dependenciesPath).toBe('src/a.ts');
  });

  it('clearAllHighlights clears user edge highlights', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.setUserDependencyHighlight(['a.ts->b.ts'], '#ff0000');
    });
    expect(result.current.userEdgeHighlights.get('a.ts->b.ts')).toBe('#ff0000');

    act(() => {
      result.current.clearAllHighlights();
    });

    expect(result.current.userEdgeHighlights.size).toBe(0);
  });

  it('exportGraphDot delegates to the graph handle', () => {
    const { result, graph } = renderOrchestration();

    act(() => {
      result.current.exportGraphDot();
    });

    expect(graph.exportDot).toHaveBeenCalled();
  });

  it('viewGraphDotOnline delegates to the graph handle', () => {
    const { result, graph } = renderOrchestration();

    act(() => {
      result.current.viewGraphDotOnline();
    });

    expect(graph.openDotOnline).toHaveBeenCalled();
  });

  it('focusActivePath focuses tree and graph when path is selected', () => {
    const { result, graph, fileTree } = renderOrchestration({
      selectedKeys: SOURCES,
    });

    act(() => {
      result.current.activatePath('src/a.ts');
    });
    act(() => {
      result.current.focusActivePath();
    });

    expect(graph.focusNode).toHaveBeenCalledWith('src/a.ts');
    expect(fileTree.focusPath).toHaveBeenCalledWith('src/a.ts');
  });

  it('clearLocalStorage removes app keys and reloads', () => {
    localStorage.setItem(`${APP_STORAGE_PREFIX}.sidebar-open`, 'true');
    localStorage.setItem(`${APP_STORAGE_PREFIX}.ignore-patterns`, '[]');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ru');
    localStorage.setItem('other-app.key', 'keep');

    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });

    const { result } = renderOrchestration();

    act(() => {
      result.current.clearLocalStorage();
    });

    expect(localStorage.getItem(`${APP_STORAGE_PREFIX}.sidebar-open`)).toBeNull();
    expect(localStorage.getItem(`${APP_STORAGE_PREFIX}.ignore-patterns`)).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('other-app.key')).toBe('keep');
    expect(reload).toHaveBeenCalled();
  });

  it('resolves activePath after collapsing its ancestor', () => {
    const { result } = renderOrchestration({ expandedKeys: ['src', 'src/b'] });

    act(() => {
      result.current.activatePath('src/b/c.ts');
    });
    expect(result.current.activePath).toBe('src/b/c.ts');

    act(() => {
      result.current.updateExpandedKeys(keys => keys.filter(key => key !== 'src/b'));
    });

    expect(result.current.activePath).toBe('src/b');
  });

  it('saveWorkspace writes selectedFiles as module sources only', () => {
    const { result } = renderOrchestration({
      selectedKeys: ['src', 'src/a.ts', 'src/b', 'src/b/c.ts'],
    });

    act(() => {
      result.current.saveWorkspace();
    });

    expect(downloadTextFile).toHaveBeenCalled();
    const [, content] = vi.mocked(downloadTextFile).mock.calls[0]!;
    const payload = JSON.parse(content as string) as {
      'dependency-cruiser-json-viewer': { settings: { selectedFiles: string[] } };
    };
    expect(payload['dependency-cruiser-json-viewer'].settings.selectedFiles).toEqual(['src/a.ts', 'src/b/c.ts']);
  });

  it('applies workspace view immediately regardless of the sources prop', () => {
    const refs = createRefs();
    const restoredExpanded = ['src', 'src/b', 'src/e', 'src/e/f'];
    const view = {
      selectedFiles: ['src/a.ts', 'src/b/c.ts', 'src/b/d.ts', 'src/e/f/g.ts'],
      expandedKeys: restoredExpanded,
      dependenciesPath: null,
      userEdgeHighlights: new Map<string, string>(),
      folderColors: {
        src: { hue: 10, lightnessIndex: 0 },
        'src/b': { hue: 20, lightnessIndex: 1 },
        'src/e': { hue: 30, lightnessIndex: 0 },
        'src/e/f': { hue: 40, lightnessIndex: 1 },
      },
      autoLayoutOnly: true,
      nodePositions: {},
    };
    const emptyInitial = { selectedKeys: [] as string[], expandedKeys: [] as string[] };
    const readyInitial = { selectedKeys: SOURCES, expandedKeys: ['src'] };

    const { result, rerender } = renderHook(
      ({ sources, initialDependencyCruiserState, cruiseLoadId }) =>
        useAppOrchestration({
          sources,
          unfilteredCruiseResult: undefined,
          ignorePatterns: [],
          fileTreeRef: refs.fileTreeRef,
          graphRef: refs.graphRef,
          initialDependencyCruiserState,
          cruiseLoadId,
        }),
      {
        initialProps: {
          sources: [] as string[],
          initialDependencyCruiserState: emptyInitial,
          cruiseLoadId: 0,
        },
      },
    );

    expect(result.current.expandedKeys).toEqual([]);

    act(() => {
      result.current.applyWorkspaceView({
        view,
        sourcesKey: SOURCES.join('\0'),
        cruiseLoadId: 1,
        lastInitialSelectedKeys: readyInitial.selectedKeys,
        lastInitialExpandedKeys: readyInitial.expandedKeys,
      });
      // Same batch as App: props catch up with the eagerly resolved sourcesKey.
      rerender({
        sources: SOURCES,
        initialDependencyCruiserState: readyInitial,
        cruiseLoadId: 1,
      });
    });

    expect(result.current.expandedKeys).toEqual(restoredExpanded);
    expect(result.current.selectedPaths).toEqual(view.selectedFiles);
  });

  it('applies workspace view with empty sources without waiting', () => {
    const refs = createRefs();
    const emptyInitial = { selectedKeys: [] as string[], expandedKeys: [] as string[] };
    const unfilteredCruiseResult = {
      modules: [{ source: 'src/a.ts', dependencies: [], dependents: [], valid: true }],
      summary: {},
    } as never;

    const { result, rerender } = renderHook(
      ({ cruiseLoadId }) =>
        useAppOrchestration({
          sources: [],
          unfilteredCruiseResult,
          ignorePatterns: ['**/*'],
          fileTreeRef: refs.fileTreeRef,
          graphRef: refs.graphRef,
          initialDependencyCruiserState: emptyInitial,
          cruiseLoadId,
        }),
      { initialProps: { cruiseLoadId: 0 } },
    );

    act(() => {
      result.current.applyWorkspaceView({
        view: {
          selectedFiles: [],
          expandedKeys: [],
          dependenciesPath: null,
          userEdgeHighlights: new Map(),
          folderColors: {},
          autoLayoutOnly: true,
          nodePositions: {},
        },
        sourcesKey: '',
        cruiseLoadId: 1,
        lastInitialSelectedKeys: [],
        lastInitialExpandedKeys: [],
      });
      rerender({ cruiseLoadId: 1 });
    });

    expect(result.current.selectedPaths).toEqual([]);
    expect(result.current.expandedKeys).toEqual([]);
  });

  it('restores layout via setLayoutState when applying workspace view', () => {
    const refs = createRefs();
    const nodePositions = { '': { 'src/a.ts': { x: 5, y: 6 } } };
    const initialDependencyCruiserState = { selectedKeys: SOURCES, expandedKeys: ['src'] };
    const view = {
      selectedFiles: ['src/a.ts', 'src/b/c.ts', 'src/b/d.ts', 'src/e/f/g.ts'],
      expandedKeys: ['src'],
      dependenciesPath: null,
      userEdgeHighlights: new Map<string, string>(),
      folderColors: {
        src: { hue: 10, lightnessIndex: 0 },
        'src/b': { hue: 20, lightnessIndex: 1 },
        'src/e': { hue: 30, lightnessIndex: 0 },
        'src/e/f': { hue: 40, lightnessIndex: 1 },
      },
      autoLayoutOnly: false,
      nodePositions,
    };

    const { result } = renderHook(() =>
      useAppOrchestration({
        sources: SOURCES,
        unfilteredCruiseResult: {
          modules: SOURCES.map(source => ({
            source,
            dependencies: [],
            dependents: [],
            valid: true,
          })),
          summary: {},
        } as never,
        ignorePatterns: [],
        fileTreeRef: refs.fileTreeRef,
        graphRef: refs.graphRef,
        initialDependencyCruiserState,
        cruiseLoadId: 1,
      }),
    );

    act(() => {
      result.current.applyWorkspaceView({
        view,
        sourcesKey: SOURCES.join('\0'),
        cruiseLoadId: 1,
        lastInitialSelectedKeys: initialDependencyCruiserState.selectedKeys,
        lastInitialExpandedKeys: initialDependencyCruiserState.expandedKeys,
      });
    });

    expect(refs.graph.setLayoutState).toHaveBeenCalledWith({
      autoLayoutOnly: false,
      nodePositions,
    });
  });
});
