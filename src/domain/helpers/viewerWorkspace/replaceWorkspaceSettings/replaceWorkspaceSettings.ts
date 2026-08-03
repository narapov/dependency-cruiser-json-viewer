import type { ICruiseResult, IModule } from 'dependency-cruiser';

import type { FolderBaseColor, MergedViewerWorkspaceView, ViewerWorkspaceSettings } from '../../../types';
import { makeDependencyKey } from '../../dependencyKey';
import { getParentPath } from '../../pathUtils';
import { VIEWER_WORKSPACE_EXTENSION_KEY } from '../constants';

/** Whether a path is a folder ancestor of one or more module sources. */
export function isFolderPath(path: string, sources: string[]): boolean {
  return sources.some(source => source.startsWith(`${path}/`));
}

/** Whether a path is a module source or a folder ancestor of one. */
export function isPathInSources(path: string, sources: string[]): boolean {
  if (sources.includes(path)) {
    return true;
  }
  return isFolderPath(path, sources);
}

/** Folder paths implied by module sources (every ancestor segment). */
export function collectFolderPaths(sources: string[]): Set<string> {
  return new Set(
    sources.flatMap(source => {
      const folders: string[] = [];
      let current = getParentPath(source);
      while (current != null) {
        folders.push(current);
        current = getParentPath(current);
      }
      return folders;
    }),
  );
}

/** All file-level dependency keys present in the cruise modules. */
export function collectAllDependencyKeys(modules: IModule[]): Set<string> {
  return new Set(
    modules.flatMap(module =>
      module.dependencies
        .filter((dep): dep is typeof dep & { resolved: string } => Boolean(dep.resolved))
        .map(dep => makeDependencyKey(module.source, dep.resolved)),
    ),
  );
}

function filterNodePositions(
  nodePositions: ViewerWorkspaceSettings['nodePositions'],
  validPaths: Set<string>,
): ViewerWorkspaceSettings['nodePositions'] {
  return Object.fromEntries(
    Object.entries(nodePositions)
      .map(([groupId, children]) => {
        const groupOk = groupId === '' || validPaths.has(groupId);
        if (!groupOk) {
          return null;
        }
        const filteredChildren = Object.fromEntries(
          Object.entries(children).filter(([childId]) => validPaths.has(childId)),
        );
        if (Object.keys(filteredChildren).length === 0) {
          return null;
        }
        return [groupId, filteredChildren] as const;
      })
      .filter((entry): entry is readonly [string, Record<string, { x: number; y: number }>] => entry != null),
  );
}

function settingsFullyCorrespond(
  settings: ViewerWorkspaceSettings,
  sources: string[],
  folderPaths: Set<string>,
  dependencyKeys: Set<string>,
  validPaths: Set<string>,
): boolean {
  const selectedFilesOk = settings.selectedFiles.every(path => sources.includes(path));
  const expandedOk = settings.expandedKeys.every(path => isPathInSources(path, sources));
  if (!selectedFilesOk || !expandedOk) {
    return false;
  }
  if (settings.dependenciesPath != null && !isPathInSources(settings.dependenciesPath, sources)) {
    return false;
  }
  if (!Object.keys(settings.userEdgeHighlights).every(key => dependencyKeys.has(key))) {
    return false;
  }
  if (!Object.keys(settings.folderColors).every(path => folderPaths.has(path))) {
    return false;
  }
  if (![...folderPaths].every(path => path in settings.folderColors)) {
    return false;
  }
  return Object.entries(settings.nodePositions).every(([groupId, children]) => {
    if (groupId !== '' && !validPaths.has(groupId)) {
      return false;
    }
    return Object.keys(children).every(childId => validPaths.has(childId));
  });
}

function filterScalarSettings(settings: ViewerWorkspaceSettings, sources: string[]) {
  return {
    selectedFiles: settings.selectedFiles.filter(path => sources.includes(path)),
    expandedKeys: settings.expandedKeys.filter(path => isPathInSources(path, sources)),
    dependenciesPath:
      settings.dependenciesPath != null && isPathInSources(settings.dependenciesPath, sources)
        ? settings.dependenciesPath
        : null,
  };
}

export interface ReplaceWorkspaceSettingsInput {
  sources: string[];
  modules: IModule[];
  settings: ViewerWorkspaceSettings;
  /** Full base color map for current sources (used to fill gaps). */
  defaultFolderColors: Record<string, FolderBaseColor>;
}

/** Replace view state from file settings (orphan-filter against the current graph). */
export function replaceWorkspaceSettings({
  sources,
  modules,
  settings,
  defaultFolderColors,
}: ReplaceWorkspaceSettingsInput): MergedViewerWorkspaceView {
  const folderPaths = collectFolderPaths(sources);
  const dependencyKeys = collectAllDependencyKeys(modules);
  const validPaths = new Set([...sources, ...folderPaths]);

  if (settingsFullyCorrespond(settings, sources, folderPaths, dependencyKeys, validPaths)) {
    return {
      selectedFiles: settings.selectedFiles,
      expandedKeys: settings.expandedKeys,
      dependenciesPath: settings.dependenciesPath,
      userEdgeHighlights: new Map(Object.entries(settings.userEdgeHighlights)),
      folderColors: settings.folderColors,
      autoLayoutOnly: settings.autoLayoutOnly,
      nodePositions: settings.nodePositions,
    };
  }

  const { selectedFiles, expandedKeys, dependenciesPath } = filterScalarSettings(settings, sources);

  const userEdgeHighlights = new Map(
    Object.entries(settings.userEdgeHighlights).filter(([key]) => dependencyKeys.has(key)),
  );

  const folderColors: Record<string, FolderBaseColor> = { ...defaultFolderColors };
  for (const [path, color] of Object.entries(settings.folderColors)) {
    if (folderPaths.has(path)) {
      folderColors[path] = color;
    }
  }

  const filteredPositions = filterNodePositions(settings.nodePositions, validPaths);
  const fileHadPositions = Object.keys(settings.nodePositions).length > 0;
  const autoLayoutOnly =
    fileHadPositions && Object.keys(filteredPositions).length === 0 ? true : settings.autoLayoutOnly;

  return {
    selectedFiles,
    expandedKeys,
    dependenciesPath,
    userEdgeHighlights,
    folderColors,
    autoLayoutOnly,
    nodePositions: filteredPositions,
  };
}

/** Strip the viewer extension from a cruise result for in-app use. */
export function stripViewerWorkspaceExtension(cruiseResult: ICruiseResult): ICruiseResult {
  const record = { ...(cruiseResult as ICruiseResult & Record<string, unknown>) };
  delete record[VIEWER_WORKSPACE_EXTENSION_KEY];
  return record as ICruiseResult;
}
