import type { ICruiseResult } from 'dependency-cruiser';

import type { ViewerWorkspaceSettings } from '../../../types';
import { VIEWER_WORKSPACE_EXTENSION_KEY, VIEWER_WORKSPACE_SCHEMA_VERSION } from '../constants';
import { stripViewerWorkspaceExtension } from '../replaceWorkspaceSettings';

/** Attach viewer workspace settings onto a cruise-result JSON object. */
export function serializeViewerWorkspace(
  cruiseResult: ICruiseResult,
  settings: ViewerWorkspaceSettings,
): ICruiseResult & Record<string, unknown> {
  const base = stripViewerWorkspaceExtension(cruiseResult);
  return {
    ...base,
    [VIEWER_WORKSPACE_EXTENSION_KEY]: {
      schemaVersion: VIEWER_WORKSPACE_SCHEMA_VERSION,
      settings,
    },
  };
}
