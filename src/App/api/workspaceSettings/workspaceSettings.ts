import axios from 'axios';

import { parseViewerFileJson, type ParsedViewerFile } from '@/domain';

/** Fetch and parse the workspace-settings JSON served by the CLI. */
export async function fetchWorkspaceSettingsFile(signal?: AbortSignal): Promise<ParsedViewerFile> {
  const { data } = await axios.get<string>(`${import.meta.env.BASE_URL}workspace-settings.json`, {
    signal,
    responseType: 'text',
    transformResponse: [raw => raw],
  });
  return parseViewerFileJson(typeof data === 'string' ? data : String(data));
}
