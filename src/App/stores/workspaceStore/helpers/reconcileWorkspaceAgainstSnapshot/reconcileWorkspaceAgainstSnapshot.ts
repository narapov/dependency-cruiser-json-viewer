import type { ICruiseResult } from 'dependency-cruiser';

import { isFileInSnapshot, type CruiseSnapshot, type FolderBaseColor, type ViewerNodeLayouts } from '@/domain';

import { defaultFolderColorsRecord } from '../../../../helpers';
import type { WorkspaceOwnState } from '../../types';
import { prunePresenceRecord } from '../prunePresenceRecord';

export interface ReconcileWorkspaceAgainstSnapshotInput {
  cruiseResult: ICruiseResult;
  cruiseSnapshot: CruiseSnapshot;
  ignorePatterns: string[];
  previous: WorkspaceOwnState;
}

function pruneNodeLayouts(
  nodeLayouts: WorkspaceOwnState['nodeLayouts'],
  cruiseSnapshot: CruiseSnapshot,
): ViewerNodeLayouts | null {
  if (!nodeLayouts) {
    return null;
  }

  const validPaths = new Set(cruiseSnapshot.nodes.keys());

  const pruned = Object.fromEntries(
    Object.entries(nodeLayouts)
      .map(([groupId, entry]) => {
        if (groupId !== '' && !validPaths.has(groupId)) {
          return null;
        }
        const children = Object.fromEntries(
          Object.entries(entry.children).filter(([childId]) => validPaths.has(childId)),
        );
        if (Object.keys(children).length === 0) {
          return null;
        }
        return [groupId, { ...entry, children }] as const;
      })
      .filter((entry): entry is readonly [string, ViewerNodeLayouts[string]] => entry != null),
  );

  return Object.keys(pruned).length > 0 ? pruned : null;
}

/** Soft-reconcile UI fields against a newly built cruise snapshot. */
export function reconcileWorkspaceAgainstSnapshot({
  cruiseResult,
  cruiseSnapshot,
  ignorePatterns,
  previous,
}: ReconcileWorkspaceAgainstSnapshotInput): WorkspaceOwnState {
  const isValidPath = (path: string) => cruiseSnapshot.nodes.has(path);

  const defaultFolderColors = defaultFolderColorsRecord(cruiseSnapshot);
  const folderBaseColors: Record<string, FolderBaseColor> = { ...defaultFolderColors };
  for (const [path, color] of Object.entries(previous.folderBaseColors)) {
    if (path in defaultFolderColors) {
      folderBaseColors[path] = color;
    }
  }

  const nodeLayouts = pruneNodeLayouts(previous.nodeLayouts, cruiseSnapshot);
  const hadLayouts = previous.nodeLayouts && Object.keys(previous.nodeLayouts).length > 0;
  const layoutsGone = !nodeLayouts;
  const autoLayoutOnly = hadLayouts && layoutsGone ? true : previous.graphSettings.autoLayoutOnly;

  return {
    cruiseResult,
    ignorePatterns,
    cruiseSnapshot,
    folderBaseColors,
    selectedFilePaths: prunePresenceRecord(previous.selectedFilePaths, path => isFileInSnapshot(cruiseSnapshot, path)),
    expandedFolderPaths: prunePresenceRecord(previous.expandedFolderPaths, isValidPath),
    activePath: previous.activePath && isValidPath(previous.activePath) ? previous.activePath : null,
    dependenciesPanelPath:
      previous.dependenciesPanelPath && isValidPath(previous.dependenciesPanelPath)
        ? previous.dependenciesPanelPath
        : null,
    applicableRulesPanelPath:
      previous.applicableRulesPanelPath && isValidPath(previous.applicableRulesPanelPath)
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
        return isFileInSnapshot(cruiseSnapshot, from) && isFileInSnapshot(cruiseSnapshot, to);
      }),
    ),
    graphSettings: {
      autoLayoutOnly,
      edgesType: previous.graphSettings.edgesType,
    },
    nodeLayouts,
  };
}
