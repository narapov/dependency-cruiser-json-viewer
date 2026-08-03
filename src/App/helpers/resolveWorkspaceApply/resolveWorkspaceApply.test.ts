import type { ICruiseResult, ISummary } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { makeDependencyKey, type ViewerWorkspaceSettings } from '@/domain';

import { resolveWorkspaceApply } from './resolveWorkspaceApply';

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
    dependenciesPath: null,
    userEdgeHighlights: { [makeDependencyKey('src/a.ts', 'src/b.ts')]: '#ff0000' },
    folderColors: {
      src: { hue: 10, lightnessIndex: 0 },
    },
    autoLayoutOnly: true,
    nodePositions: {},
    ...overrides,
  };
}

describe('resolveWorkspaceApply', () => {
  it('returns a fully corresponding view when settings match the filtered graph', () => {
    const settings = makeSettings();
    const { sourcesKey, view, lastInitialSelectedKeys, lastInitialExpandedKeys } = resolveWorkspaceApply({
      cruiseResult,
      settings,
    });

    expect(sourcesKey).toBe(['src/a.ts', 'src/b.ts', 'src/c.test.ts'].join('\0'));
    expect(view.selectedFiles).toEqual(settings.selectedFiles);
    expect(view.expandedKeys).toEqual(settings.expandedKeys);
    expect(view.userEdgeHighlights.get(makeDependencyKey('src/a.ts', 'src/b.ts'))).toBe('#ff0000');
    expect(view.folderColors).toEqual(settings.folderColors);
    expect(lastInitialSelectedKeys).toEqual(['src', 'src/a.ts', 'src/b.ts', 'src/c.test.ts']);
    expect(lastInitialExpandedKeys).toEqual(expect.arrayContaining(['src']));
  });

  it('drops invalid references that do not exist in the filtered graph', () => {
    const settings = makeSettings({
      selectedFiles: ['src/a.ts', 'src/missing.ts'],
      expandedKeys: ['src', 'src/gone'],
      dependenciesPath: 'src/missing.ts',
      userEdgeHighlights: {
        [makeDependencyKey('src/a.ts', 'src/b.ts')]: '#ff0000',
        [makeDependencyKey('src/a.ts', 'src/missing.ts')]: '#00ff00',
      },
      folderColors: {
        src: { hue: 10, lightnessIndex: 0 },
        'src/gone': { hue: 20, lightnessIndex: 1 },
      },
      nodePositions: {
        '': { 'src/a.ts': { x: 1, y: 2 }, 'src/missing.ts': { x: 3, y: 4 } },
      },
      autoLayoutOnly: false,
    });

    const { view } = resolveWorkspaceApply({ cruiseResult, settings });

    expect(view.selectedFiles).toEqual(['src/a.ts']);
    expect(view.expandedKeys).toEqual(['src']);
    expect(view.dependenciesPath).toBeNull();
    expect(view.userEdgeHighlights.get(makeDependencyKey('src/a.ts', 'src/b.ts'))).toBe('#ff0000');
    expect(view.userEdgeHighlights.has(makeDependencyKey('src/a.ts', 'src/missing.ts'))).toBe(false);
    expect(view.folderColors).toHaveProperty('src');
    expect(view.folderColors).not.toHaveProperty('src/gone');
    expect(view.nodePositions).toEqual({ '': { 'src/a.ts': { x: 1, y: 2 } } });
  });

  it('filters sources down to empty when ignore patterns exclude everything', () => {
    const settings = makeSettings({
      ignorePatterns: ['**/*'],
      selectedFiles: ['src/a.ts'],
      expandedKeys: ['src'],
    });

    const { sourcesKey, view, lastInitialSelectedKeys, lastInitialExpandedKeys } = resolveWorkspaceApply({
      cruiseResult,
      settings,
    });

    expect(sourcesKey).toBe('');
    expect(view.selectedFiles).toEqual([]);
    expect(view.expandedKeys).toEqual([]);
    expect(lastInitialSelectedKeys).toEqual([]);
    expect(lastInitialExpandedKeys).toEqual([]);
  });
});
