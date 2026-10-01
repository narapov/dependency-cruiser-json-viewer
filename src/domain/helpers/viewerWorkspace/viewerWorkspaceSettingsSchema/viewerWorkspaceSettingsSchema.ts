import { array, boolean, literal, number, object, record, string, enum as zodEnum, type ZodType } from 'zod';

import type { FolderBaseColor, ViewerNodeLayouts, ViewerWorkspaceSettings } from '../../../types';
import { VIEWER_WORKSPACE_EXTENSION_KEY, VIEWER_WORKSPACE_SCHEMA_VERSION } from '../constants';

const folderBaseColorSchema = object({
  hue: number().min(0).max(360),
  lightnessIndex: number().int().min(0),
}) satisfies ZodType<FolderBaseColor>;

const position2DSchema = object({
  x: number(),
  y: number(),
});

const childLayoutSchema = object({
  id: string(),
  position: position2DSchema,
  width: number().optional(),
  height: number().optional(),
});

const groupLayoutSchema = object({
  id: string(),
  width: number().optional(),
  height: number().optional(),
  children: record(string(), childLayoutSchema),
});

const graphEdgesTypeSchema = zodEnum(['bezier', 'straight', 'simpleOrthogonal', 'libavoidOrthogonal']);

/** Zod schema for viewer workspace settings (schemaVersion 1). */
export const viewerWorkspaceSettingsSchema = object({
  ignorePatterns: array(string()),
  selectedFiles: array(string()),
  expandedKeys: array(string()),
  dependenciesPath: string().nullable(),
  applicableRulesPath: string().nullable().optional().default(null),
  userEdgeHighlights: record(string(), string()),
  folderColors: record(string(), folderBaseColorSchema),
  autoLayoutOnly: boolean(),
  edgesType: graphEdgesTypeSchema.optional().default('bezier'),
  nodePositions: record(string(), record(string(), position2DSchema)).optional().default({}),
  nodeLayouts: record(string(), groupLayoutSchema).optional().default({}),
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

/** Convert legacy position-only maps into group layout entries (sizes omitted). */
export function nodePositionsToNodeLayouts(
  nodePositions: Record<string, Record<string, { x: number; y: number }>>,
): ViewerNodeLayouts {
  return Object.fromEntries(
    Object.entries(nodePositions).map(([groupId, children]) => [
      groupId,
      {
        id: groupId,
        children: Object.fromEntries(
          Object.entries(children).map(([childId, position]) => [childId, { id: childId, position }]),
        ),
      },
    ]),
  );
}

/** Derive legacy position maps from group layouts (drops sizes). */
export function nodeLayoutsToNodePositions(
  nodeLayouts: ViewerNodeLayouts,
): Record<string, Record<string, { x: number; y: number }>> {
  return Object.fromEntries(
    Object.entries(nodeLayouts).map(([groupId, entry]) => [
      groupId,
      Object.fromEntries(Object.entries(entry.children).map(([childId, child]) => [childId, { ...child.position }])),
    ]),
  );
}
