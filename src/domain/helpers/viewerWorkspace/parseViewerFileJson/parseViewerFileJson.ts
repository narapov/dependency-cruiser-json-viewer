import type { ICruiseResult } from 'dependency-cruiser';

import type { ViewerWorkspaceSettings } from '../../../types';
import { CruiseResultParseError, validateCruiseResult } from '../../cruiseResult';
import { VIEWER_WORKSPACE_EXTENSION_KEY } from '../constants';
import { stripViewerWorkspaceExtension } from '../replaceWorkspaceSettings';
import { viewerWorkspaceExtensionSchema } from '../viewerWorkspaceSettingsSchema';

export interface ParsedViewerFile {
  cruiseResult: ICruiseResult;
  settings?: ViewerWorkspaceSettings;
  /** True when the viewer extension key was present but could not be parsed. */
  workspaceSettingsIgnored?: boolean;
}

/** Parse cruise-result JSON, optionally extracting viewer workspace settings. */
export function parseViewerFileJson(text: string): ParsedViewerFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new CruiseResultParseError('invalidJson', { cause: error });
  }

  const cruiseResult = validateCruiseResult(parsed);
  const extensionValue = (parsed as Record<string, unknown>)[VIEWER_WORKSPACE_EXTENSION_KEY];

  if (extensionValue == null) {
    return { cruiseResult: stripViewerWorkspaceExtension(cruiseResult) };
  }

  const extension = viewerWorkspaceExtensionSchema.safeParse(extensionValue);
  if (!extension.success) {
    return {
      cruiseResult: stripViewerWorkspaceExtension(cruiseResult),
      workspaceSettingsIgnored: true,
    };
  }

  return {
    cruiseResult: stripViewerWorkspaceExtension(cruiseResult),
    settings: extension.data.settings,
  };
}
