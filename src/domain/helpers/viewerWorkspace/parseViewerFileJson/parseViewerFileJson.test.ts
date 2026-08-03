import type { ICruiseResult, IModule, ISummary } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import {
  parseViewerFileJson,
  replaceWorkspaceSettings,
  serializeViewerWorkspace,
  VIEWER_WORKSPACE_EXTENSION_KEY,
  VIEWER_WORKSPACE_SCHEMA_VERSION,
} from '..';
import type { ViewerWorkspaceSettings } from '../../../types';
import { CruiseResultParseError } from '../../cruiseResult';

const validResult = {
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
  ],
  summary: {
    totalCruised: 2,
    violations: [],
    error: 0,
    warn: 0,
    info: 0,
    ignore: 0,
    optionsUsed: { args: '' },
    environment: {} as ISummary['environment'],
  },
} as ICruiseResult;

const defaultFolderColors = {
  src: { hue: 10, lightnessIndex: 0 },
};

function makeSettings(overrides: Partial<ViewerWorkspaceSettings> = {}): ViewerWorkspaceSettings {
  return {
    ignorePatterns: [],
    selectedFiles: ['src/a.ts', 'src/b.ts'],
    expandedKeys: ['src'],
    dependenciesPath: null,
    userEdgeHighlights: { 'src/a.ts->src/b.ts': '#ff0000' },
    folderColors: defaultFolderColors,
    autoLayoutOnly: true,
    nodePositions: {},
    ...overrides,
  };
}

describe('parseViewerFileJson', () => {
  it('parses plain cruise result without settings', () => {
    const result = parseViewerFileJson(JSON.stringify(validResult));
    expect(result.settings).toBeUndefined();
    expect(result.cruiseResult.modules).toHaveLength(2);
  });

  it('extracts settings from valid extension', () => {
    const settings = makeSettings();
    const withExtension = {
      ...validResult,
      [VIEWER_WORKSPACE_EXTENSION_KEY]: {
        schemaVersion: VIEWER_WORKSPACE_SCHEMA_VERSION,
        settings,
      },
    };
    const result = parseViewerFileJson(JSON.stringify(withExtension));
    expect(result.settings).toEqual(settings);
    expect(result.cruiseResult).not.toHaveProperty(VIEWER_WORKSPACE_EXTENSION_KEY);
  });

  it('ignores unknown schemaVersion', () => {
    const withExtension = {
      ...validResult,
      [VIEWER_WORKSPACE_EXTENSION_KEY]: {
        schemaVersion: 99,
        settings: makeSettings(),
      },
    };
    const result = parseViewerFileJson(JSON.stringify(withExtension));
    expect(result.settings).toBeUndefined();
    expect(result.workspaceSettingsIgnored).toBe(true);
  });

  it('throws invalidJson for malformed JSON', () => {
    expect(() => parseViewerFileJson('{ not json')).toThrow(CruiseResultParseError);
  });
});

describe('serializeViewerWorkspace', () => {
  it('attaches schemaVersion 1 and settings under the extension key', () => {
    const settings = makeSettings();
    const serialized = serializeViewerWorkspace(validResult, settings);
    expect(serialized[VIEWER_WORKSPACE_EXTENSION_KEY]).toEqual({
      schemaVersion: 1,
      settings,
    });
    expect(serialized.modules).toEqual(validResult.modules);
  });
});

describe('replaceWorkspaceSettings', () => {
  const sources = ['src/a.ts', 'src/b.ts'];
  const modules = validResult.modules as IModule[];

  it('accepts settings wholesale on full correspondence', () => {
    const settings = makeSettings({
      selectedFiles: ['src/a.ts'],
      expandedKeys: [],
      autoLayoutOnly: false,
      nodePositions: { '': { 'src/a.ts': { x: 1, y: 2 } } },
    });
    const replaced = replaceWorkspaceSettings({
      sources,
      modules,
      settings,
      defaultFolderColors,
    });
    expect(replaced.selectedFiles).toEqual(['src/a.ts']);
    expect(replaced.autoLayoutOnly).toBe(false);
    expect(replaced.nodePositions).toEqual({ '': { 'src/a.ts': { x: 1, y: 2 } } });
    expect(replaced.userEdgeHighlights.get('src/a.ts->src/b.ts')).toBe('#ff0000');
  });

  it('drops orphan paths and fills folder colors from defaults', () => {
    const settings = makeSettings({
      selectedFiles: ['src/a.ts', 'gone.ts'],
      expandedKeys: ['missing'],
      folderColors: { src: { hue: 99, lightnessIndex: 1 }, gone: { hue: 1, lightnessIndex: 0 } },
      userEdgeHighlights: { 'src/a.ts->src/b.ts': '#00ff00', 'x->y': '#000' },
    });
    const replaced = replaceWorkspaceSettings({
      sources,
      modules,
      settings,
      defaultFolderColors,
    });
    expect(replaced.selectedFiles).toEqual(['src/a.ts']);
    expect(replaced.expandedKeys).toEqual([]);
    expect(replaced.folderColors.src).toEqual({ hue: 99, lightnessIndex: 1 });
    expect(replaced.folderColors).not.toHaveProperty('gone');
    expect(replaced.userEdgeHighlights.has('x->y')).toBe(false);
    expect(replaced.userEdgeHighlights.get('src/a.ts->src/b.ts')).toBe('#00ff00');
  });

  it('keeps empty selectedFiles when nothing matches sources', () => {
    const settings = makeSettings({
      selectedFiles: ['gone.ts'],
      expandedKeys: ['src'],
    });
    const replaced = replaceWorkspaceSettings({
      sources,
      modules,
      settings,
      defaultFolderColors,
    });
    expect(replaced.selectedFiles).toEqual([]);
    expect(replaced.expandedKeys).toEqual(['src']);
  });

  it('drops folder paths from selectedFiles without expanding them', () => {
    const settings = makeSettings({
      selectedFiles: ['src', 'src/a.ts'],
    });
    const replaced = replaceWorkspaceSettings({
      sources,
      modules,
      settings,
      defaultFolderColors,
    });
    expect(replaced.selectedFiles).toEqual(['src/a.ts']);
  });

  it('keeps remaining positions when some groups are invalid', () => {
    const settings = makeSettings({
      selectedFiles: ['src/a.ts'],
      expandedKeys: [],
      autoLayoutOnly: false,
      nodePositions: {
        '': { 'src/a.ts': { x: 1, y: 2 } },
        gone: { 'gone.ts': { x: 9, y: 9 } },
      },
    });
    const replaced = replaceWorkspaceSettings({
      sources,
      modules,
      settings,
      defaultFolderColors,
    });
    expect(replaced.autoLayoutOnly).toBe(false);
    expect(replaced.nodePositions).toEqual({ '': { 'src/a.ts': { x: 1, y: 2 } } });
  });

  it('forces autoLayoutOnly when all positions are invalid', () => {
    const settings = makeSettings({
      selectedFiles: ['src/a.ts'],
      expandedKeys: [],
      autoLayoutOnly: false,
      nodePositions: {
        gone: { 'gone.ts': { x: 9, y: 9 } },
      },
    });
    const replaced = replaceWorkspaceSettings({
      sources,
      modules,
      settings,
      defaultFolderColors,
    });
    expect(replaced.autoLayoutOnly).toBe(true);
    expect(replaced.nodePositions).toEqual({});
  });
});
