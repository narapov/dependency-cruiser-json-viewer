// @vitest-environment jsdom
import type { ICruiseResult, IModule, ISummary } from 'dependency-cruiser';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { LANGUAGE_STORAGE_KEY } from '@/i18n';
import { APP_STORAGE_PREFIX, copyToClipboard, downloadTextFile, THEME_STORAGE_KEY } from '@/Shared';

import type { DependencyGraphHandle } from '../../partials/DependencyGraph';
import type { FileTreeHandle } from '../../partials/FileTree';
import { initialWorkspaceState, pathsToPresenceRecord, useWorkspaceStore } from '../../stores/workspaceStore';
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

function modulesOf(sources: readonly string[]): IModule[] {
  return sources.map(source => ({ source, dependencies: [], dependents: [], valid: true }) as IModule);
}

function modulesWithDependency(from: string, to: string, sources: readonly string[]): IModule[] {
  return modulesOf(sources).map(module =>
    module.source === from
      ? ({ ...module, dependencies: [{ resolved: to, dependencyTypes: ['local'] }] } as IModule)
      : module,
  );
}

function cruiseResultOf(modules: IModule[], violations: ICruiseResult['summary']['violations'] = []): ICruiseResult {
  return {
    modules,
    summary: {
      totalCruised: modules.length,
      violations,
      error: 0,
      warn: 0,
      info: 0,
      ignore: 0,
      advisedExitCode: 0,
      optionsUsed: { args: '' },
      environment: {} as ISummary['environment'],
    },
  } as ICruiseResult;
}

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
    getLayoutState: vi.fn(() => ({ autoLayoutOnly: true, edgesType: 'bezier', nodeLayouts: {} })),
  };
  (fileTreeRef as { current: FileTreeHandle }).current = fileTree as unknown as FileTreeHandle;
  (graphRef as { current: DependencyGraphHandle }).current = graph as unknown as DependencyGraphHandle;
  return { fileTreeRef, graphRef, fileTree, graph };
}

function seedWorkspace(
  overrides: {
    modules?: IModule[];
    selectedKeys?: string[];
    expandedKeys?: string[];
    violations?: ICruiseResult['summary']['violations'];
  } = {},
) {
  const modules = overrides.modules ?? modulesOf(SOURCES);
  useWorkspaceStore.getState().reset(cruiseResultOf(modules, overrides.violations), 'hard');
  if (overrides.selectedKeys) {
    useWorkspaceStore.getState().setSelectedFilePaths(pathsToPresenceRecord(overrides.selectedKeys));
  }
  if (overrides.expandedKeys) {
    useWorkspaceStore.getState().setExpandedFolderPaths(pathsToPresenceRecord(overrides.expandedKeys), {
      replace: true,
    });
  }
}

function renderOrchestration(
  overrides: Partial<{
    modules: IModule[];
    selectedKeys: string[];
    expandedKeys: string[];
    violations: ICruiseResult['summary']['violations'];
  }> = {},
) {
  const refs = createRefs();
  seedWorkspace({
    modules: overrides.modules,
    selectedKeys: overrides.selectedKeys ?? SOURCES,
    expandedKeys: overrides.expandedKeys ?? ['src', 'src/b'],
    violations: overrides.violations,
  });
  const hook = renderHook(() =>
    useAppOrchestration({
      fileTreeRef: refs.fileTreeRef,
      graphRef: refs.graphRef,
    }),
  );
  return { ...hook, ...refs };
}

describe('useAppOrchestration', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspaceStore.setState({ ...initialWorkspaceState, userEdgeHighlights: new Map() });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes from workspace store', () => {
    const { result } = renderOrchestration({
      selectedKeys: ['src/a.ts'],
      expandedKeys: ['src'],
    });

    expect(result.current.selectedPaths).toEqual(['src/a.ts']);
    expect(result.current.expandedKeys).toEqual(['src']);
    expect(result.current.activePath).toBeNull();
    expect(result.current.dependenciesPanelOpen).toBe(false);
    expect(result.current.applicableRulesPanelOpen).toBe(false);
  });

  it('follows soft reset when cruise result sources change', () => {
    const { result } = renderOrchestration({
      selectedKeys: ['src/a.ts'],
      expandedKeys: ['src'],
    });

    act(() => {
      useWorkspaceStore.getState().reset(cruiseResultOf(modulesOf(['src/b/c.ts'])), 'soft');
    });

    expect(result.current.selectedPaths).toEqual([]);
    expect(result.current.expandedKeys).toEqual(['src']);
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
      result.current.handleShowDependenciesPanel('src/a.ts');
    });
    expect(result.current.dependenciesPath).toBe('src/a.ts');
    expect(result.current.dependenciesPanelOpen).toBe(true);
    expect(result.current.applicableRulesPanelOpen).toBe(false);

    act(() => {
      result.current.handleClosePanel();
    });
    expect(result.current.dependenciesPath).toBeNull();
    expect(result.current.dependenciesPanelOpen).toBe(false);
  });

  it('opens and closes applicable rules panel independently of dependencies panel', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.handleShowDependenciesPanel('src/a.ts');
      result.current.handleShowApplicableRulesPanel('src/b/c.ts');
    });
    expect(result.current.dependenciesPath).toBe('src/a.ts');
    expect(result.current.applicableRulesPath).toBe('src/b/c.ts');
    expect(result.current.dependenciesPanelOpen).toBe(true);
    expect(result.current.applicableRulesPanelOpen).toBe(true);

    act(() => {
      result.current.handleClosePanel();
    });
    expect(result.current.dependenciesPath).toBeNull();
    expect(result.current.applicableRulesPath).toBe('src/b/c.ts');
    expect(result.current.dependenciesPanelOpen).toBe(false);
    expect(result.current.applicableRulesPanelOpen).toBe(true);

    act(() => {
      result.current.handleCloseApplicableRulesPanel();
    });
    expect(result.current.applicableRulesPath).toBeNull();
    expect(result.current.applicableRulesPanelOpen).toBe(false);
  });

  it('resolves activePath to null when path leaves sources', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.activatePath('src/a.ts');
    });
    expect(result.current.activePath).toBe('src/a.ts');

    act(() => {
      useWorkspaceStore.getState().reset(cruiseResultOf(modulesOf(['src/b/c.ts'])), 'soft');
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

  it('showCircularDependenciesOnly selects circular modules and expands ancestors', () => {
    const modules = [
      {
        source: 'src/a.ts',
        dependencies: [],
        dependents: [],
        valid: true,
      },
      {
        source: 'src/b/c.ts',
        dependencies: [
          {
            resolved: 'src/b/d.ts',
            circular: true,
            dependencyTypes: ['local', 'import'],
          },
        ],
        dependents: [],
        valid: true,
      },
      {
        source: 'src/b/d.ts',
        dependencies: [],
        dependents: [],
        valid: true,
      },
      {
        source: 'src/e/f/g.ts',
        dependencies: [
          {
            resolved: 'src/a.ts',
            circular: true,
            dependencyTypes: ['local', 'type-only', 'import'],
          },
        ],
        dependents: [],
        valid: true,
      },
    ] as unknown as IModule[];
    const { result } = renderOrchestration({
      modules,
      selectedKeys: SOURCES,
      expandedKeys: [],
    });

    act(() => {
      result.current.showCircularDependenciesOnly();
    });

    expect(result.current.selectedPaths).toEqual(
      expect.arrayContaining(['src/a.ts', 'src/b/c.ts', 'src/b/d.ts', 'src/e/f/g.ts']),
    );
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b', 'src/e', 'src/e/f']));
  });

  it('showCircularDependenciesOnly clears selection when there are no circular modules', () => {
    const { result } = renderOrchestration({
      selectedKeys: SOURCES,
      expandedKeys: ['src', 'src/b'],
    });

    act(() => {
      result.current.showCircularDependenciesOnly();
    });

    expect(result.current.selectedPaths).toEqual([]);
    expect(result.current.expandedKeys).toEqual(['src', 'src/b']);
  });

  it('showRuleViolationsOnly selects modules from matching violations and expands ancestors', () => {
    const { result } = renderOrchestration({
      selectedKeys: SOURCES,
      expandedKeys: [],
      violations: [
        {
          type: 'dependency',
          rule: { name: 'no-circular', severity: 'error' },
          from: 'src/b/c.ts',
          to: 'src/b/d.ts',
        },
        {
          type: 'dependency',
          rule: { name: 'other-rule', severity: 'warn' },
          from: 'src/a.ts',
          to: 'src/e/f/g.ts',
        },
      ],
    });

    act(() => {
      result.current.showRuleViolationsOnly(['no-circular']);
    });

    expect(result.current.selectedPaths).toEqual(expect.arrayContaining(['src/b/c.ts', 'src/b/d.ts']));
    expect(result.current.selectedPaths).not.toContain('src/a.ts');
    expect(result.current.selectedPaths).not.toContain('src/b');
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b']));
  });

  it('showRuleViolationsOnly clears selection when there are no matching violations', () => {
    const { result } = renderOrchestration({
      selectedKeys: SOURCES,
      expandedKeys: ['src', 'src/b'],
    });

    act(() => {
      result.current.showRuleViolationsOnly(['missing-rule']);
    });

    expect(result.current.selectedPaths).toEqual([]);
    expect(result.current.expandedKeys).toEqual(['src', 'src/b']);
  });

  it('showPathsOnly selects given paths and expands ancestors', () => {
    const { result } = renderOrchestration({
      selectedKeys: SOURCES,
      expandedKeys: [],
    });

    act(() => {
      result.current.showPathsOnly(['src/b/c.ts', 'src/b/d.ts']);
    });

    expect(result.current.selectedPaths).toEqual(expect.arrayContaining(['src/b/c.ts', 'src/b/d.ts']));
    expect(result.current.selectedPaths).not.toContain('src/a.ts');
    expect(result.current.selectedPaths).not.toContain('src/b');
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b']));
  });

  it('hideOthers keeps only the target file and does not change expandedKeys', () => {
    const { result } = renderOrchestration({
      selectedKeys: SOURCES,
      expandedKeys: ['src', 'src/b'],
    });

    act(() => {
      result.current.hideOthers('src/a.ts');
    });

    expect(result.current.selectedPaths).toEqual(['src/a.ts']);
    expect(result.current.expandedKeys).toEqual(['src', 'src/b']);
  });

  it('hideOthers keeps all modules under a folder without changing expandedKeys', () => {
    const { result } = renderOrchestration({
      selectedKeys: SOURCES,
      expandedKeys: ['src'],
    });

    act(() => {
      result.current.hideOthers('src/b');
    });

    expect(result.current.selectedPaths).toEqual(expect.arrayContaining(['src/b/c.ts', 'src/b/d.ts']));
    expect(result.current.selectedPaths).not.toContain('src/a.ts');
    expect(result.current.selectedPaths).not.toContain('src/b');
    expect(result.current.expandedKeys).toEqual(['src']);
  });

  it('hideOthers on a folder keeps only already-selected modules under it', () => {
    const { result } = renderOrchestration({
      selectedKeys: ['src/a.ts', 'src/b/c.ts'],
      expandedKeys: ['src', 'src/b'],
    });

    act(() => {
      result.current.hideOthers('src/b');
    });

    expect(result.current.selectedPaths).toEqual(['src/b/c.ts']);
    expect(result.current.selectedPaths).not.toContain('src/b/d.ts');
    expect(result.current.selectedPaths).not.toContain('src/a.ts');
    expect(result.current.expandedKeys).toEqual(['src', 'src/b']);
  });

  it('showDirectDependencies adds related modules to the selection', () => {
    const sources = ['src/a.ts', 'src/b/c.ts', 'src/b/d.ts'];
    const { result } = renderOrchestration({
      modules: modulesWithDependency('src/a.ts', 'src/b/c.ts', sources),
      selectedKeys: ['src/a.ts'],
      expandedKeys: [],
    });

    act(() => {
      result.current.showDirectDependencies('src/a.ts');
    });

    expect(result.current.selectedPaths).toEqual(expect.arrayContaining(['src/a.ts', 'src/b/c.ts']));
    expect(result.current.selectedPaths).not.toContain('src/b/d.ts');
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b']));
  });

  it('showDirectDependencies expands ancestors of already-selected related modules', () => {
    const sources = ['src/a.ts', 'src/b/c.ts', 'src/b/d.ts'];
    const { result } = renderOrchestration({
      modules: modulesWithDependency('src/a.ts', 'src/b/c.ts', sources),
      selectedKeys: ['src/a.ts', 'src/b/c.ts'],
      expandedKeys: [],
    });

    act(() => {
      result.current.showDirectDependencies('src/a.ts');
    });

    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b']));
  });

  it('showDirectDependents adds incoming modules to the selection', () => {
    const sources = ['src/a.ts', 'src/b/c.ts', 'src/b/d.ts'];
    const { result } = renderOrchestration({
      modules: modulesWithDependency('src/b/c.ts', 'src/a.ts', sources),
      selectedKeys: ['src/a.ts'],
      expandedKeys: [],
    });

    act(() => {
      result.current.showDirectDependents('src/a.ts');
    });

    expect(result.current.selectedPaths).toEqual(expect.arrayContaining(['src/a.ts', 'src/b/c.ts']));
    expect(result.current.selectedPaths).not.toContain('src/b/d.ts');
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b']));
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

  it('expandActiveToLevel and collapseActiveToLevel are directional soft walks', () => {
    const { result } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.activatePath('src/e');
    });

    act(() => {
      result.current.collapseActive();
    });
    expect(result.current.expandedKeys).not.toContain('src/e');

    act(() => {
      result.current.expandActiveToLevel(1);
    });
    expect(result.current.expandedKeys).toContain('src/e');
    expect(result.current.expandedKeys).not.toContain('src/e/f');

    act(() => {
      result.current.expandActiveToLevel(2);
    });
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src/e', 'src/e/f']));

    act(() => {
      result.current.collapseActiveToLevel(1);
    });
    expect(result.current.expandedKeys).toContain('src/e');
    expect(result.current.expandedKeys).not.toContain('src/e/f');
  });

  it('expandRootsToLevel and collapseRootsToLevel apply to tree roots', () => {
    const { result } = renderOrchestration({ expandedKeys: [] });

    act(() => {
      result.current.expandRootsToLevel(1);
    });
    expect(result.current.expandedKeys).toContain('src');

    act(() => {
      result.current.expandRootsToLevel(2);
    });
    expect(result.current.expandedKeys).toEqual(expect.arrayContaining(['src', 'src/b', 'src/e']));

    act(() => {
      result.current.collapseRootsToLevel(1);
    });
    expect(result.current.expandedKeys).toContain('src');
    expect(result.current.expandedKeys).not.toContain('src/b');
    expect(result.current.expandedKeys).not.toContain('src/e');
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

  it('viewActiveItemDependenciesPanel opens panel for active path', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.activatePath('src/a.ts');
    });
    act(() => {
      result.current.viewActiveItemDependenciesPanel();
    });

    expect(result.current.dependenciesPath).toBe('src/a.ts');
  });

  it('viewActiveItemApplicableRulesPanel opens applicable rules panel for active path', () => {
    const { result } = renderOrchestration();

    act(() => {
      result.current.activatePath('src/a.ts');
    });
    act(() => {
      result.current.viewActiveItemApplicableRulesPanel();
    });

    expect(result.current.applicableRulesPath).toBe('src/a.ts');
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
      useWorkspaceStore.getState().setExpandedFolderPaths({ 'src/b': false });
    });

    expect(result.current.activePath).toBe('src/b');
  });

  it('saveWorkspace writes selectedFiles as module sources only', () => {
    const { result } = renderOrchestration({
      selectedKeys: ['src/a.ts', 'src/b/c.ts'],
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
});
