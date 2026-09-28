import type { CruiseSnapshot, VisibleTreeNode } from '@/domain';

import type { PresenceRecord } from '../../../types';

export interface GraphVisibilityFromVisibleTree {
  visibleNodes: Map<string, 'folder' | 'file'>;
  parentByNode: Map<string, string | null>;
  visibleNodeIds: Set<string>;
  expandedFolders: Set<string>;
  circularByPath: Map<string, boolean>;
  unresolvedModules: Set<string>;
  selectedSet: Set<string>;
}

function presencePaths(record: PresenceRecord): string[] {
  return Object.entries(record)
    .filter(([, present]) => present)
    .map(([path]) => path);
}

/** Walk a visible tree into maps needed by graph nodes and layout. */
export function deriveGraphVisibilityFromVisibleTree(
  cruiseSnapshot: CruiseSnapshot,
  visibleTree: readonly VisibleTreeNode[],
  selectedFilePaths: PresenceRecord,
): GraphVisibilityFromVisibleTree {
  const visibleNodes = new Map<string, 'folder' | 'file'>();
  const parentByNode = new Map<string, string | null>();
  const expandedFolders = new Set<string>();
  const circularByPath = new Map<string, boolean>();
  const unresolvedModules = new Set<string>();

  const stack: { node: VisibleTreeNode; parentPath: string | null }[] = visibleTree.map(node => ({
    node,
    parentPath: null,
  }));

  while (stack.length > 0) {
    const { node, parentPath } = stack.pop()!;
    const snapshotNode = cruiseSnapshot.nodes.get(node.path);
    const type: 'folder' | 'file' = snapshotNode?.isFolder ? 'folder' : 'file';

    visibleNodes.set(node.path, type);
    parentByNode.set(node.path, parentPath);
    circularByPath.set(node.path, node.valueCircular);

    if (type === 'file' && snapshotNode?.originModule?.couldNotResolve) {
      unresolvedModules.add(node.path);
    }

    if (node.children) {
      expandedFolders.add(node.path);
      node.children.forEach(child => {
        stack.push({ node: child, parentPath: node.path });
      });
    }
  }

  return {
    visibleNodes,
    parentByNode,
    visibleNodeIds: new Set(visibleNodes.keys()),
    expandedFolders,
    circularByPath,
    unresolvedModules,
    selectedSet: new Set(presencePaths(selectedFilePaths)),
  };
}
