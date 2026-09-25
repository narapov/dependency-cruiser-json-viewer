import type { ICruiseResult } from 'dependency-cruiser';

import {
  buildCruiseTreeSnapshot,
  filterCruiseResult,
  getInitialDependencyCruiserState,
  replaceWorkspaceSettings,
  type MergedViewerWorkspaceView,
  type ViewerWorkspaceSettings,
} from '@/domain';

import { defaultFolderColorsRecord } from '../defaultFolderColorsRecord';

export interface ResolveWorkspaceApplyInput {
  cruiseResult: ICruiseResult;
  settings: ViewerWorkspaceSettings;
}

export interface ResolvedWorkspaceApply {
  sourcesKey: string;
  view: MergedViewerWorkspaceView;
  lastInitialSelectedKeys: string[];
  lastInitialExpandedKeys: string[];
}

/** Compute a fully-resolved workspace view from raw cruise data and loaded settings. */
export function resolveWorkspaceApply({ cruiseResult, settings }: ResolveWorkspaceApplyInput): ResolvedWorkspaceApply {
  const filtered = filterCruiseResult(cruiseResult, settings.ignorePatterns);
  const cruiseTree = buildCruiseTreeSnapshot(filtered.modules);
  const sources = cruiseTree.descendantFiles;
  const initial = getInitialDependencyCruiserState(sources);
  const view = replaceWorkspaceSettings({
    sources,
    modules: filtered.modules,
    settings,
    defaultFolderColors: defaultFolderColorsRecord(cruiseTree),
  });
  return {
    sourcesKey: sources.join('\0'),
    view,
    lastInitialSelectedKeys: initial.selectedKeys,
    lastInitialExpandedKeys: initial.expandedKeys,
  };
}
