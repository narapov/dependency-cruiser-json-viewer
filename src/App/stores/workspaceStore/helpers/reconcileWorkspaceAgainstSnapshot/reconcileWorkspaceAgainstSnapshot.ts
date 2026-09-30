import type { ICruiseResult } from 'dependency-cruiser';

import {
  getCruiseSources,
  isPathInSources,
  type CruiseSnapshot,
  type FolderBaseColor,
  type ViewerNodeLayouts,
} from '@/domain';

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

function pruneNodeLayouts(
  nodeLayouts: WorkspaceOwnState['nodeLayouts'],
  sources: readonly string[],
): ViewerNodeLayouts | null {
  if (nodeLayouts == null) {
    return null;
  }

  const validPaths = new Set([
    ...sources,
    ...sources.flatMap(source => {
      const folders: string[] = [];
      let rest = source;
      while (rest.includes('/')) {
        rest = rest.slice(0, rest.lastIndexOf('/'));
        if (rest) {
          folders.push(rest);
        }
      }
      return folders;
    }),
  ]);

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
  const nodeLayouts = pruneNodeLayouts(previous.nodeLayouts, sources);
  const hadLayouts =
    (previous.nodeLayouts != null && Object.keys(previous.nodeLayouts).length > 0) ||
    (previous.nodePositions != null && Object.keys(previous.nodePositions).length > 0);
  const layoutsGone = nodeLayouts == null && nodePositions == null;
  const autoLayoutOnly = hadLayouts && layoutsGone ? true : previous.graphSettings.autoLayoutOnly;

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
    nodeLayouts,
  };
}
