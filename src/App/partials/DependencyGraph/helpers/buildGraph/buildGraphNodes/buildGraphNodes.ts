import type { Node } from '@xyflow/react';

import { getBaseName } from '@/domain';

import type { FileNodeData, FolderChildren, FolderGroupNodeData, FolderNodeData } from '../../../types';
import { getLeafNodeSize } from '../../getLeafNodeSize';
import { folderHasCircularDescendant } from '../buildVisibleNodes';
import { toNodeDimensions } from '../nodeDimensions';

/** Inputs needed to create React Flow nodes for visible files and folders. */
export interface BuildGraphNodesInput {
  visibleNodes: Map<string, 'folder' | 'file'>;
  parentByNode: Map<string, string | null>;
  expandedFolders: Set<string>;
  selectedSet: Set<string>;
  childrenIndex: Map<string, FolderChildren>;
  circularModules: Set<string>;
  unresolvedModules: Set<string>;
  folderColors: ReadonlyMap<string, string>;
  onToggleFolder: (path: string) => void;
  onExpandRecursive: (path: string) => void;
  onShowInFileTree: (path: string) => void;
  onShowDependencies?: (path: string) => void;
}

function createVisibleNode(path: string, type: 'folder' | 'file', input: BuildGraphNodesInput): Node {
  const {
    parentByNode,
    expandedFolders,
    selectedSet,
    childrenIndex,
    circularModules,
    unresolvedModules,
    folderColors,
    onToggleFolder,
    onExpandRecursive,
    onShowInFileTree,
    onShowDependencies,
  } = input;
  const parentId = parentByNode.get(path) ?? undefined;

  if (type === 'folder') {
    const expanded = expandedFolders.has(path);

    if (expanded) {
      const data: FolderGroupNodeData = {
        label: getBaseName(path),
        path,
        expanded: true,
        backgroundColor: folderColors.get(path) ?? 'rgba(0, 0, 0, 0.02)',
        onToggle: onToggleFolder,
        onExpandRecursive,
        onShowInFileTree,
        onShowDependencies,
      };

      return {
        id: path,
        type: 'folderGroup',
        position: { x: 0, y: 0 },
        data,
        parentId,
        draggable: true,
        dragHandle: '.folder-group-header',
        extent: parentId ? 'parent' : undefined,
        zIndex: -1,
        style: { pointerEvents: 'none' },
      };
    }

    const label = getBaseName(path);
    const circular = folderHasCircularDescendant(path, selectedSet, childrenIndex, circularModules);
    const leafSize = getLeafNodeSize(label, 'folder');
    const data: FolderNodeData = {
      label,
      path,
      expanded: false,
      circular,
      backgroundColor: folderColors.get(path) ?? 'rgba(0, 0, 0, 0.02)',
      onToggle: onToggleFolder,
      onExpandRecursive,
      onShowInFileTree,
      onShowDependencies,
    };
    return {
      id: path,
      type: 'folder',
      position: { x: 0, y: 0 },
      data,
      parentId,
      draggable: true,
      extent: parentId ? 'parent' : undefined,
      ...toNodeDimensions(leafSize),
    };
  }

  const label = getBaseName(path);
  const leafSize = getLeafNodeSize(label, 'file');
  const data: FileNodeData = {
    label,
    path,
    circular: circularModules.has(path),
    couldNotResolve: unresolvedModules.has(path),
    onShowInFileTree,
    onShowDependencies,
  };
  return {
    id: path,
    type: 'file',
    position: { x: 0, y: 0 },
    data,
    parentId,
    draggable: true,
    extent: parentId ? 'parent' : undefined,
    ...toNodeDimensions(leafSize),
  };
}

/** Creates folder, folder-group, and file React Flow nodes for the visible set. */
export function buildGraphNodes(input: BuildGraphNodesInput): Map<string, Node> {
  return new Map([...input.visibleNodes.entries()].map(([path, type]) => [path, createVisibleNode(path, type, input)]));
}
