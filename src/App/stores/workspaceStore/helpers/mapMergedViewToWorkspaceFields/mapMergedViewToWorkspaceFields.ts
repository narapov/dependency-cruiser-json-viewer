import type { MergedViewerWorkspaceView } from '@/domain';

import type { WorkspaceOwnState } from '../../types';
import { normalizeNodePositions } from '../normalizeNodePositions';
import { pathsToPresenceRecord } from '../pathsToPresenceRecord';

/** Map a merged viewer settings view onto workspace store field slices (no cruise data). */
export function mapMergedViewToWorkspaceFields(
  view: MergedViewerWorkspaceView,
): Pick<
  WorkspaceOwnState,
  | 'selectedFilePaths'
  | 'expandedFolderPaths'
  | 'dependenciesPanelPath'
  | 'applicableRulesPanelPath'
  | 'folderBaseColors'
  | 'userEdgeHighlights'
  | 'graphSettings'
  | 'nodePositions'
  | 'activePath'
> {
  return {
    selectedFilePaths: pathsToPresenceRecord(view.selectedFiles),
    expandedFolderPaths: pathsToPresenceRecord(view.expandedKeys),
    dependenciesPanelPath: view.dependenciesPath,
    applicableRulesPanelPath: view.applicableRulesPath,
    folderBaseColors: view.folderColors,
    userEdgeHighlights: view.userEdgeHighlights,
    graphSettings: {
      autoLayoutOnly: view.autoLayoutOnly,
      edgesType: view.edgesType,
    },
    nodePositions: normalizeNodePositions(view.nodePositions),
    activePath: null,
  };
}
