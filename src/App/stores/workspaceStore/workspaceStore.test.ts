import type { ICruiseResult, ISummary } from 'dependency-cruiser';
import { beforeEach, describe, expect, it } from 'vitest';

import {
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
    expect(state.cruiseTree.descendantFiles).toEqual(['src/a.ts', 'src/b.ts', 'src/c.test.ts']);
    expect(state.selectedFilePaths['src/a.ts']).toBe(true);
    expect(state.expandedFolderPaths.src).toBe(true);
    expect(state.activePath).toBeNull();
    expect(state.dependenciesPanelPath).toBeNull();
    expect(state.applicableRulesPanelPath).toBeNull();
    expect(state.graphSettings).toEqual({ autoLayoutOnly: true, edgesType: 'bezier' });
    expect(state.nodePositions).toBeNull();
    expect(state.folderBaseColors).toHaveProperty('src');
  });

  it('hard-resets from embedded workspace settings when present', () => {
    const settings = makeSettings({
      ignorePatterns: ['**/*.test.ts'],
      selectedFiles: ['src/a.ts'],
      expandedKeys: ['src'],
      dependenciesPath: 'src/a.ts',
      applicableRulesPath: null,
    });
    const state = useWorkspaceStore.getState().reset(withEmbeddedSettings(settings), 'hard');

    expect(state.ignorePatterns).toEqual(['**/*.test.ts']);
    expect(state.cruiseTree.descendantFiles).toEqual(['src/a.ts', 'src/b.ts']);
    expect(state.selectedFilePaths).toEqual({ 'src/a.ts': true });
    expect(state.expandedFolderPaths).toEqual({ src: true });
    expect(state.dependenciesPanelPath).toBe('src/a.ts');
    expect(state.applicableRulesPanelPath).toBeNull();
    expect(state.activePath).toBeNull();
    expect(state.graphSettings).toEqual({ autoLayoutOnly: false, edgesType: 'straight' });
    expect(state.nodePositions).toEqual({ '': { 'src/a.ts': { x: 1, y: 2 } } });
    expect(state.folderBaseColors.src).toEqual({ hue: 10, lightnessIndex: 0 });
  });

  it('soft-reset keeps valid UI fields and drops orphans against the new tree', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');
    useWorkspaceStore.getState().setIgnorePatterns([]);
    useWorkspaceStore.getState().setSelectedFilePaths({
      'src/a.ts': true,
      'src/missing.ts': true,
    });
    useWorkspaceStore.getState().setExpandedFolderPaths({
      src: true,
      gone: true,
    });
    useWorkspaceStore.getState().setActivePath('src/a.ts');
    useWorkspaceStore.getState().setDependenciesPanelPath('src/missing.ts');
    useWorkspaceStore.getState().setApplicableRulesPanelPath('src/b.ts');
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: false, edgesType: 'simpleOrthogonal' });
    useWorkspaceStore.getState().setNodePositions({
      '': {
        'src/a.ts': { x: 10, y: 20 },
        'src/missing.ts': { x: 1, y: 1 },
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
    expect(state.graphSettings.edgesType).toBe('simpleOrthogonal');
    expect(state.nodePositions).toEqual({ '': { 'src/a.ts': { x: 10, y: 20 } } });
    expect(state.cruiseTree.descendantFiles).toEqual(['src/a.ts', 'src/c.test.ts']);
  });
});

describe('useWorkspaceStore.syncWorkspaceSettings', () => {
  it('applies settings against the current cruise result', () => {
    useWorkspaceStore.getState().reset(cruiseResult, 'hard');

    const state = useWorkspaceStore.getState().syncWorkspaceSettings(
      makeSettings({
        ignorePatterns: ['**/*.test.ts'],
        selectedFiles: ['src/b.ts'],
        expandedKeys: ['src'],
        dependenciesPath: null,
        applicableRulesPath: 'src/b.ts',
        autoLayoutOnly: true,
        edgesType: 'bezier',
        nodePositions: {},
      }),
    );

    expect(state.ignorePatterns).toEqual(['**/*.test.ts']);
    expect(state.cruiseTree.descendantFiles).toEqual(['src/a.ts', 'src/b.ts']);
    expect(state.selectedFilePaths).toEqual({ 'src/b.ts': true });
    expect(state.applicableRulesPanelPath).toBe('src/b.ts');
    expect(state.activePath).toBeNull();
    expect(state.nodePositions).toBeNull();
  });

  it('throws when cruiseResult is not loaded', () => {
    expect(() => useWorkspaceStore.getState().syncWorkspaceSettings(makeSettings())).toThrow(
      /requires a loaded cruiseResult/,
    );
  });
});

describe('useWorkspaceStore.setIgnorePatterns', () => {
  it('rebuilds the cruise tree and clears invalid panel paths', () => {
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
    expect(state.cruiseTree.descendantFiles).toEqual(['src/a.ts', 'src/b.ts']);
    expect(state.selectedFilePaths).toEqual({ 'src/a.ts': true });
    expect(state.activePath).toBeNull();
    expect(state.dependenciesPanelPath).toBeNull();
    expect(state.applicableRulesPanelPath).toBe('src/a.ts');
  });
});
