import type { ICruiseResult } from 'dependency-cruiser';

import { getCruiseSources, isPathInSources, type CruiseSnapshot, type FolderBaseColor } from '@/domain';

import { defaultFolderColorsRecord } from '../../../../helpers';
import type { WorkspaceOwnState } from '../../types';
import { pruneNodePositions } from '../pruneNodePositions';
import { prunePresenceRecord } from '../prunePresenceRecord';

export interface ReconcileWorkspaceAgainstSnapshotInput {
  cruiseResult: ICruiseResult;
  cruiseSnapshot: CruiseSnapshot;
  ignorePatterns: string[];
  previous: WorkspaceOwnState;
}

/** Soft-reconcile UI fields against a newly built cruise snapshot. */
export function reconcileWorkspaceAgainstSnapshot({
  cruiseResult,
  cruiseSnapshot,
  ignorePatterns,
  previous,
}: ReconcileWorkspaceAgainstSnapshotInput): WorkspaceOwnState {
  const sources = getCruiseSources(cruiseSnapshot);
  const isValidPath = (path: string) => isPathInSources(path, sources);
  const sourceSet = new Set(sources);

  const defaultFolderColors = defaultFolderColorsRecord(cruiseSnapshot);
  const folderBaseColors: Record<string, FolderBaseColor> = { ...defaultFolderColors };
  for (const [path, color] of Object.entries(previous.folderBaseColors)) {
    if (path in defaultFolderColors) {
      folderBaseColors[path] = color;
    }
  }

  const nodePositions = pruneNodePositions(previous.nodePositions, sources);
  const hadPositions = previous.nodePositions != null && Object.keys(previous.nodePositions).length > 0;
  const autoLayoutOnly = hadPositions && nodePositions == null ? true : previous.graphSettings.autoLayoutOnly;

  return {
    cruiseResult,
    ignorePatterns,
    cruiseSnapshot,
    folderBaseColors,
    selectedFilePaths: prunePresenceRecord(previous.selectedFilePaths, path => sourceSet.has(path)),
    expandedFolderPaths: prunePresenceRecord(previous.expandedFolderPaths, isValidPath),
    activePath: previous.activePath != null && isValidPath(previous.activePath) ? previous.activePath : null,
    dependenciesPanelPath:
      previous.dependenciesPanelPath != null && isValidPath(previous.dependenciesPanelPath)
        ? previous.dependenciesPanelPath
        : null,
    applicableRulesPanelPath:
      previous.applicableRulesPanelPath != null && isValidPath(previous.applicableRulesPanelPath)
        ? previous.applicableRulesPanelPath
        : null,
    userEdgeHighlights: new Map(
      [...previous.userEdgeHighlights.entries()].filter(([key]) => {
        const separator = key.indexOf('->');
        if (separator < 0) {
          return false;
        }
        const from = key.slice(0, separator);
        const to = key.slice(separator + 2);
        return sourceSet.has(from) && sourceSet.has(to);
      }),
    ),
    graphSettings: {
      autoLayoutOnly,
      edgesType: previous.graphSettings.edgesType,
    },
    nodePositions,
  };
}
