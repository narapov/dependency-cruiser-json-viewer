import { array, boolean, literal, number, object, record, string, type ZodType } from 'zod';

import type { FolderBaseColor, ViewerWorkspaceSettings } from '../../../types';
import { VIEWER_WORKSPACE_EXTENSION_KEY, VIEWER_WORKSPACE_SCHEMA_VERSION } from '../constants';

const folderBaseColorSchema = object({
  hue: number().min(0).max(360),
  lightnessIndex: number().int().min(0),
}) satisfies ZodType<FolderBaseColor>;

const position2DSchema = object({
  x: number(),
  y: number(),
});

/** Zod schema for viewer workspace settings (schemaVersion 1). */
export const viewerWorkspaceSettingsSchema = object({
  ignorePatterns: array(string()),
  selectedFiles: array(string()),
  expandedKeys: array(string()),
  dependenciesPath: string().nullable(),
  userEdgeHighlights: record(string(), string()),
  folderColors: record(string(), folderBaseColorSchema),
  autoLayoutOnly: boolean(),
  nodePositions: record(string(), record(string(), position2DSchema)),
}) satisfies ZodType<ViewerWorkspaceSettings>;

/** Zod schema for the cruise-result extension object. */
export const viewerWorkspaceExtensionSchema = object({
  schemaVersion: literal(VIEWER_WORKSPACE_SCHEMA_VERSION),
  settings: viewerWorkspaceSettingsSchema,
});

export type ViewerWorkspaceExtension = {
  schemaVersion: typeof VIEWER_WORKSPACE_SCHEMA_VERSION;
  settings: ViewerWorkspaceSettings;
};

/** Runtime key used on cruise-result JSON objects. */
export { VIEWER_WORKSPACE_EXTENSION_KEY };
