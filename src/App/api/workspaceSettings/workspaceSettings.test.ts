// @vitest-environment jsdom
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CruiseResultParseError, VIEWER_WORKSPACE_EXTENSION_KEY, VIEWER_WORKSPACE_SCHEMA_VERSION } from '@/domain';

import { fetchWorkspaceSettingsFile } from './workspaceSettings';

const settings = {
  ignorePatterns: [],
  selectedFiles: ['src/a.ts'],
  expandedKeys: ['src'],
  dependenciesPath: null,
  applicableRulesPath: null,
  userEdgeHighlights: {},
  folderColors: { src: { hue: 10, lightnessIndex: 0 } },
  autoLayoutOnly: true,
  edgeStyle: 'bezier',
  nodePositions: {},
};

const workspacePayload = {
  modules: [
    {
      source: 'src/a.ts',
      dependencies: [],
      dependents: [],
      valid: true,
    },
  ],
  summary: {},
  [VIEWER_WORKSPACE_EXTENSION_KEY]: {
    schemaVersion: VIEWER_WORKSPACE_SCHEMA_VERSION,
    settings,
  },
};

const server = setupServer(
  http.get('/workspace-settings.json', () => HttpResponse.text(JSON.stringify(workspacePayload))),
);

describe('fetchWorkspaceSettingsFile', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('fetches and parses viewer workspace settings JSON', async () => {
    const result = await fetchWorkspaceSettingsFile();

    expect(result.settings).toEqual(settings);
    expect(result.cruiseResult.modules).toHaveLength(1);
    expect(result.cruiseResult).not.toHaveProperty(VIEWER_WORKSPACE_EXTENSION_KEY);
  });

  it('propagates parse errors', async () => {
    server.use(http.get('/workspace-settings.json', () => HttpResponse.text('{ not json')));

    await expect(fetchWorkspaceSettingsFile()).rejects.toBeInstanceOf(CruiseResultParseError);
  });
});
