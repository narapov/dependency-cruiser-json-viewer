import type { ICruiseResult } from 'dependency-cruiser';

import { VIEWER_WORKSPACE_EXTENSION_KEY, viewerWorkspaceExtensionSchema, type ViewerWorkspaceSettings } from '@/domain';

/** Read validated viewer workspace settings from a cruise-result extension field, if present. */
export function extractEmbeddedWorkspaceSettings(cruiseResult: ICruiseResult): ViewerWorkspaceSettings | undefined {
  const extensionValue = (cruiseResult as ICruiseResult & Record<string, unknown>)[VIEWER_WORKSPACE_EXTENSION_KEY];
  if (!extensionValue) {
    return undefined;
  }

  const extension = viewerWorkspaceExtensionSchema.safeParse(extensionValue);
  if (!extension.success) {
    return undefined;
  }

  return extension.data.settings;
}
