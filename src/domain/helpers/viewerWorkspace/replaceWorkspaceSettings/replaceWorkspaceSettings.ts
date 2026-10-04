import type { ICruiseResult } from 'dependency-cruiser';

import type {
  CruiseSnapshot,
  FolderBaseColor,
  MergedViewerWorkspaceView,
  ViewerNodeLayouts,
  ViewerWorkspaceSettings,
} from '../../../types';
import { isFileInSnapshot } from '../../cruiseSnapshot';
import { VIEWER_WORKSPACE_EXTENSION_KEY } from '../constants';
import { nodePositionsToNodeLayouts } from '../viewerWorkspaceSettingsSchema';

/** Prefer explicit nodeLayouts; otherwise migrate legacy nodePositions. */
export function resolveNodeLayouts(settings: ViewerWorkspaceSettings): ViewerNodeLayouts {
  if (Object.keys(settings.nodeLayouts).length > 0) {
    return settings.nodeLayouts;
  }
  return nodePositionsToNodeLayouts(settings.nodePositions);
}

function filterNodeLayouts(nodeLayouts: ViewerNodeLayouts, validPaths: ReadonlySet<string>): ViewerNodeLayouts {
  return Object.fromEntries(
    Object.entries(nodeLayouts)
      .map(([groupId, entry]) => {
        const groupOk = groupId === '' || validPaths.has(groupId);
        if (!groupOk) {
          return null;
        }
        const filteredChildren = Object.fromEntries(
          Object.entries(entry.children).filter(([childId]) => validPaths.has(childId)),
        );
        if (Object.keys(filteredChildren).length === 0) {
          return null;
        }
        return [groupId, { ...entry, children: filteredChildren }] as const;
      })
      .filter((entry): entry is readonly [string, ViewerNodeLayouts[string]] => entry != null),
  );
}

function folderPathsInSnapshot(cruiseSnapshot: CruiseSnapshot): Set<string> {
  return new Set(
    cruiseSnapshot.nodes
      .values()
      .filter(node => node.isFolder)
      .map(node => node.path)
      .toArray(),
  );
}

function settingsFullyCorrespond(
  settings: ViewerWorkspaceSettings,
  cruiseSnapshot: CruiseSnapshot,
  folderPaths: ReadonlySet<string>,
  validPaths: ReadonlySet<string>,
): boolean {
  const selectedFilesOk = settings.selectedFiles.every(path => isFileInSnapshot(cruiseSnapshot, path));
  const expandedOk = settings.expandedKeys.every(path => cruiseSnapshot.nodes.has(path));
  if (!selectedFilesOk || !expandedOk) {
    return false;
  }
  if (settings.dependenciesPath && !cruiseSnapshot.nodes.has(settings.dependenciesPath)) {
    return false;
  }
  if (settings.applicableRulesPath && !cruiseSnapshot.nodes.has(settings.applicableRulesPath)) {
    return false;
  }
  if (!Object.keys(settings.userEdgeHighlights).every(key => cruiseSnapshot.dependencies.byDependencyKey.has(key))) {
    return false;
  }
  if (!Object.keys(settings.folderColors).every(path => folderPaths.has(path))) {
    return false;
  }
  if (![...folderPaths].every(path => path in settings.folderColors)) {
    return false;
  }
  const layouts = resolveNodeLayouts(settings);
  return Object.entries(layouts).every(([groupId, entry]) => {
    if (groupId !== '' && !validPaths.has(groupId)) {
      return false;
    }
    return Object.keys(entry.children).every(childId => validPaths.has(childId));
  });
}

function filterScalarSettings(settings: ViewerWorkspaceSettings, cruiseSnapshot: CruiseSnapshot) {
  return {
    selectedFiles: settings.selectedFiles.filter(path => isFileInSnapshot(cruiseSnapshot, path)),
    expandedKeys: settings.expandedKeys.filter(path => cruiseSnapshot.nodes.has(path)),
    dependenciesPath:
      settings.dependenciesPath && cruiseSnapshot.nodes.has(settings.dependenciesPath)
        ? settings.dependenciesPath
        : null,
    applicableRulesPath:
      settings.applicableRulesPath && cruiseSnapshot.nodes.has(settings.applicableRulesPath)
        ? settings.applicableRulesPath
        : null,
  };
}

export interface ReplaceWorkspaceSettingsInput {
  cruiseSnapshot: CruiseSnapshot;
  settings: ViewerWorkspaceSettings;
  /** Full base color map for current sources (used to fill gaps). */
  defaultFolderColors: Record<string, FolderBaseColor>;
}

/** Replace view state from file settings (orphan-filter against the current graph). */
export function replaceWorkspaceSettings({
  cruiseSnapshot,
  settings,
  defaultFolderColors,
}: ReplaceWorkspaceSettingsInput): MergedViewerWorkspaceView {
  const folderPaths = folderPathsInSnapshot(cruiseSnapshot);
  const validPaths = new Set(cruiseSnapshot.nodes.keys());
  const resolvedLayouts = resolveNodeLayouts(settings);

  if (settingsFullyCorrespond(settings, cruiseSnapshot, folderPaths, validPaths)) {
    return {
      selectedFiles: settings.selectedFiles,
      expandedKeys: settings.expandedKeys,
      dependenciesPath: settings.dependenciesPath,
      applicableRulesPath: settings.applicableRulesPath,
      userEdgeHighlights: new Map(Object.entries(settings.userEdgeHighlights)),
      folderColors: settings.folderColors,
      autoLayoutOnly: settings.autoLayoutOnly,
      edgesType: settings.edgesType,
      nodeLayouts: resolvedLayouts,
    };
  }

  const { selectedFiles, expandedKeys, dependenciesPath, applicableRulesPath } = filterScalarSettings(
    settings,
    cruiseSnapshot,
  );

  const userEdgeHighlights = new Map(
    Object.entries(settings.userEdgeHighlights).filter(([key]) => cruiseSnapshot.dependencies.byDependencyKey.has(key)),
  );

  const folderColors: Record<string, FolderBaseColor> = { ...defaultFolderColors };
  for (const [path, color] of Object.entries(settings.folderColors)) {
    if (folderPaths.has(path)) {
      folderColors[path] = color;
    }
  }

  const filteredLayouts = filterNodeLayouts(resolvedLayouts, validPaths);
  const fileHadLayouts = Object.keys(resolvedLayouts).length > 0;
  const autoLayoutOnly = fileHadLayouts && Object.keys(filteredLayouts).length === 0 ? true : settings.autoLayoutOnly;

  return {
    selectedFiles,
    expandedKeys,
    dependenciesPath,
    applicableRulesPath,
    userEdgeHighlights,
    folderColors,
    autoLayoutOnly,
    edgesType: settings.edgesType,
    nodeLayouts: filteredLayouts,
  };
}

/** Strip the viewer extension from a cruise result for in-app use. */
export function stripViewerWorkspaceExtension(cruiseResult: ICruiseResult): ICruiseResult {
  const record = { ...(cruiseResult as ICruiseResult & Record<string, unknown>) };
  delete record[VIEWER_WORKSPACE_EXTENSION_KEY];
  return record as ICruiseResult;
}
