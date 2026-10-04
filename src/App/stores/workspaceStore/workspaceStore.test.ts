import type { ICruiseResult, ISummary } from 'dependency-cruiser';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  getCruiseSources,
  makeDependencyKey,
  VIEWER_WORKSPACE_EXTENSION_KEY,
  VIEWER_WORKSPACE_SCHEMA_VERSION,
  type ViewerWorkspaceSettings,
} from '@/domain';

import { initialWorkspaceState, useWorkspaceStore } from './workspaceStore';

const cruiseResult = {
  modules: [
    {
      source: 'src/a.ts',
      dependencies: [{ resolved: 'src/b.ts' }],
      dependents: [],
      valid: true,
    },
    {
      source: 'src/b.ts',
      dependencies: [],
      dependents: ['src/a.ts'],
      valid: true,
    },
    {
      source: 'src/c.test.ts',
      dependencies: [],
      dependents: [],
      valid: true,
    },
  ],
  summary: {
    totalCruised: 3,
    violations: [],
    error: 0,
    warn: 0,
    info: 0,
    ignore: 0,
    advisedExitCode: 0,
    optionsUsed: { args: '' },
    environment: {} as ISummary['environment'],
  },
} as ICruiseResult;

function makeSettings(overrides: Partial<ViewerWorkspaceSettings> = {}): ViewerWorkspaceSettings {
  return {
    ignorePatterns: [],
    selectedFiles: ['src/a.ts', 'src/b.ts'],
    expandedKeys: ['src'],
    dependenciesPath: 'src/a.ts',
    applicableRulesPath: 'src/b.ts',
    userEdgeHighlights: {},
    folderColors: {
      src: { hue: 10, lightnessIndex: 0 },
    },
    autoLayoutOnly: false,
    edgesType: 'straight',
    nodePositions: {
      '': { 'src/a.ts': { x: 1, y: 2 } },
    },
    nodeLayouts: {},
    ...overrides,
  };
}

function withEmbeddedSettings(settings: ViewerWorkspaceSettings): ICruiseResult {
  return {
    ...cruiseResult,
    [VIEWER_WORKSPACE_EXTENSION_KEY]: {
      schemaVersion: VIEWER_WORKSPACE_SCHEMA_VERSION,
      settings,
    },
  } as ICruiseResult;
}

beforeEach(() => {
  useWorkspaceStore.setState({ ...initialWorkspaceState });
});

describe('useWorkspaceStore.reset', () => {
  it('hard-resets to defaults when cruise result has no embedded settings', () => {
    const state = useWorkspaceStore.getState().reset(cruiseResult, 'hard');

    expect(state.cruiseResult).not.toHaveProperty(VIEWER_WORKSPACE_EXTENSION_KEY);
    expect(state.ignorePatterns).toEqual([]);
    expect(getCruiseSources(state.cruiseSnapshot).sort()).toEqual(
      ['src/a.ts', 'src/b.ts', 'src/c.test.ts'].slice().sort(),
    );
    expect(state.selectedFilePaths['src/a.ts']).toBe(true);
    expect(state.expandedFolderPaths.src).toBe(true);
    expect(state.activePath).toBeNull();
    expect(state.dependenciesPanelPath).toBeNull();
    expect(state.applicableRulesPanelPath).toBeNull();
    expect(state.userEdgeHighlights.size).toBe(0);
    expect(state.graphSettings).toEqual({ autoLayoutOnly: true, edgesType: 'bezier' });
    expect(state.nodeLayouts).toBeNull();
    expect(state.folderBaseColors).toHaveProperty('src');
  });

  it('hard-resets from embedded workspace settings when present', () => {
    const depKey = makeDependencyKey('src/a.ts', 'src/b.ts');
    const settings = makeSettings({
      ignorePatterns: ['**/*.test.ts'],
      selectedFiles: ['src/a.ts'],
      expandedKeys: ['src'],
      dependenciesPath: 'src/a.ts',
      applicableRulesPath: null,
      userEdgeHighlights: { [depKey]: '#ff0000' },
    });
    const state = useWorkspaceStore.getState().reset(withEmbeddedSettings(settings), 'hard');

    expect(state.ignorePatterns).toEqual(['**/*.test.ts']);
    expect(getCruiseSources(state.cruiseSnapshot).sort()).toEqual(['src/a.ts', 'src/b.ts'].slice().sort());
    expect(state.selectedFilePaths).toEqual({ 'src/a.ts': true });
    expect(state.expandedFolderPaths).toEqual({ src: true });
    expect(state.dependenciesPanelPath).toBe('src/a.ts');
    expect(state.applicableRulesPanelPath).toBeNull();
    expect(state.activePath).toBeNull();
    expect(state.userEdgeHighlights.get(depKey)).toBe('#ff0000');
    expect(state.graphSettings).toEqual({ autoLayoutOnly: false, edgesType: 'straight' });
    expect(state.nodeLayouts).toEqual({
      '': {
        id: '',
        children: { 'src/a.ts': { id: 'src/a.ts', position: { x: 1, y: 2 } } },
      },
    });
    expect(state.folderBaseColors.src).toEqual({ hue: 10, lightnessIndex: 0 });
  });

  it('soft-reset keeps valid UI fields and drops orphans against the new tree', () => {
    const keptKey = makeDependencyKey('src/a.ts', 'src/b.ts');
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setIgnorePatterns([]);
    useWorkspaceStore.getState().setSelectedFilePaths({
      'src/a.ts': true,
      'src/missing.ts': true,
    });
    useWorkspaceStore.getState().setExpandedFolderPaths(
      {
        src: true,
        gone: true,
      },
      { replace: true },
    );
    useWorkspaceStore.getState().setActivePath('src/a.ts');
    useWorkspaceStore.getState().setDependenciesPanelPath('src/missing.ts');
    useWorkspaceStore.getState().setApplicableRulesPanelPath('src/b.ts');
    useWorkspaceStore.getState().setUserEdgeHighlights(
      new Map([
        [keptKey, '#ff0000'],
        [makeDependencyKey('src/a.ts', 'src/missing.ts'), '#00ff00'],
      ]),
    );
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: false, edgesType: 'simpleOrthogonal' });
    useWorkspaceStore.setState({
      nodeLayouts: {
        '': {
          id: '',
          children: {
            'src/a.ts': { id: 'src/a.ts', position: { x: 10, y: 20 } },
            'src/missing.ts': { id: 'src/missing.ts', position: { x: 1, y: 1 } },
          },
        },
      },
    });

    const nextCruise = {
      ...cruiseResult,
      modules: cruiseResult.modules.filter(module => module.source !== 'src/b.ts'),
    } as ICruiseResult;

    const state = useWorkspaceStore.getState().reset(nextCruise, 'soft');

    expect(state.selectedFilePaths).toEqual({ 'src/a.ts': true });
    expect(state.expandedFolderPaths).toEqual({ src: true });
    expect(state.activePath).toBe('src/a.ts');
    expect(state.dependenciesPanelPath).toBeNull();
    expect(state.applicableRulesPanelPath).toBeNull();
    expect(state.userEdgeHighlights.size).toBe(0);
    expect(state.graphSettings.edgesType).toBe('simpleOrthogonal');
    expect(state.nodeLayouts).toEqual({
      '': {
        id: '',
        children: {
          'src/a.ts': { id: 'src/a.ts', position: { x: 10, y: 20 } },
        },
      },
    });
    expect(getCruiseSources(state.cruiseSnapshot).sort()).toEqual(['src/a.ts', 'src/c.test.ts'].slice().sort());
  });
});

describe('useWorkspaceStore.syncWorkspaceSettings', () => {
  it('applies settings against the current cruise result', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');

    const depKey = makeDependencyKey('src/a.ts', 'src/b.ts');
    const state = useWorkspaceStore.getState().syncWorkspaceSettings(
      makeSettings({
        ignorePatterns: ['**/*.test.ts'],
        selectedFiles: ['src/b.ts'],
        expandedKeys: ['src'],
        dependenciesPath: null,
        applicableRulesPath: 'src/b.ts',
        userEdgeHighlights: { [depKey]: '#abcdef' },
        autoLayoutOnly: true,
        edgesType: 'bezier',
        nodePositions: {},
        nodeLayouts: {},
      }),
    );

    expect(state.ignorePatterns).toEqual(['**/*.test.ts']);
    expect(getCruiseSources(state.cruiseSnapshot).sort()).toEqual(['src/a.ts', 'src/b.ts'].slice().sort());
    expect(state.selectedFilePaths).toEqual({ 'src/b.ts': true });
    expect(state.applicableRulesPanelPath).toBe('src/b.ts');
    expect(state.activePath).toBeNull();
    expect(state.userEdgeHighlights.get(depKey)).toBe('#abcdef');
    expect(state.nodeLayouts).toBeNull();
  });

  it('throws when cruiseResult is not loaded', () => {
    expect(() => useWorkspaceStore.getState().syncWorkspaceSettings(makeSettings())).toThrow(
      /requires a loaded cruiseResult/,
    );
  });
});

describe('useWorkspaceStore.setIgnorePatterns', () => {
  it('rebuilds the cruise snapshot and clears invalid panel paths', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setSelectedFilePaths({
      'src/a.ts': true,
      'src/c.test.ts': true,
    });
    useWorkspaceStore.getState().setActivePath('src/c.test.ts');
    useWorkspaceStore.getState().setDependenciesPanelPath('src/c.test.ts');
    useWorkspaceStore.getState().setApplicableRulesPanelPath('src/a.ts');

    useWorkspaceStore.getState().setIgnorePatterns(['**/*.test.ts']);
    const state = useWorkspaceStore.getState();

    expect(state.ignorePatterns).toEqual(['**/*.test.ts']);
    expect(getCruiseSources(state.cruiseSnapshot).sort()).toEqual(['src/a.ts', 'src/b.ts'].slice().sort());
    expect(state.selectedFilePaths).toEqual({ 'src/a.ts': true });
    expect(state.activePath).toBeNull();
    expect(state.dependenciesPanelPath).toBeNull();
    expect(state.applicableRulesPanelPath).toBe('src/a.ts');
  });
});

describe('useWorkspaceStore.setSelectedFilePaths', () => {
  it('stores only descendant files when folder paths are passed', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');

    useWorkspaceStore.getState().setSelectedFilePaths({
      src: true,
      'src/a.ts': true,
    });

    expect(useWorkspaceStore.getState().selectedFilePaths).toEqual({
      'src/a.ts': true,
      'src/b.ts': true,
      'src/c.test.ts': true,
    });
  });
});

describe('useWorkspaceStore.setExpandedFolderPaths', () => {
  it('merges true keys without clearing peers', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setExpandedFolderPaths({ src: true }, { replace: true });

    useWorkspaceStore.getState().setExpandedFolderPaths({ 'src/extra': true });

    expect(useWorkspaceStore.getState().expandedFolderPaths).toEqual({ src: true, 'src/extra': true });
  });

  it('merges false keys without clearing peers', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setExpandedFolderPaths({ src: true, 'src/extra': true }, { replace: true });

    useWorkspaceStore.getState().setExpandedFolderPaths({ 'src/extra': false });

    expect(useWorkspaceStore.getState().expandedFolderPaths).toEqual({ src: true, 'src/extra': false });
  });

  it('replace clears omitted keys and moves activePath out of collapsed subtrees', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setExpandedFolderPaths({ src: true }, { replace: true });
    useWorkspaceStore.getState().setActivePath('src/a.ts');

    useWorkspaceStore.getState().setExpandedFolderPaths({}, { replace: true });

    expect(useWorkspaceStore.getState().expandedFolderPaths).toEqual({});
    expect(useWorkspaceStore.getState().activePath).toBe('src');
  });

  it('does not change activePath when nothing collapses', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setExpandedFolderPaths({ src: true }, { replace: true });
    useWorkspaceStore.getState().setActivePath('src/a.ts');

    useWorkspaceStore.getState().setExpandedFolderPaths({ 'src/extra': true });

    expect(useWorkspaceStore.getState().expandedFolderPaths).toEqual({ src: true, 'src/extra': true });
    expect(useWorkspaceStore.getState().activePath).toBe('src/a.ts');
  });

  it('keeps visibleTree reference when present expanded paths are unchanged', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setExpandedFolderPaths({ src: true }, { replace: true });
    const before = useWorkspaceStore.getState().visibleTree;

    useWorkspaceStore.getState().setExpandedFolderPaths({ src: true });

    expect(useWorkspaceStore.getState().visibleTree).toBe(before);
  });
});
