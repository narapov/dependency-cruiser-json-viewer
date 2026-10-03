import type { Edge, Node } from '@xyflow/react';

import { getBaseName, type CruiseSnapshot } from '@/domain';

import type {
  DependencyEdgeData,
  FileNodeData,
  FolderGroupNodeData,
  FolderNodeData,
  RoutableEdge,
  VisibleTreeLayoutedNode,
} from '../../types';
import { buildAncestryIndex } from '../customPositionedGraph';
import { sortNodesByDepth } from '../sortNodesByDepth';

export interface ReactFlowGraphFromLayout {
  nodes: Node[];
  parentByNode: Map<string, string | null>;
  visibleNodeIds: Set<string>;
}

function toNodeDimensions(width: number, height: number): Pick<Node, 'width' | 'height' | 'style'> {
  return {
    width,
    height,
    style: { width, height },
  };
}

function createReactFlowNode(
  node: VisibleTreeLayoutedNode,
  parentId: string | null,
  cruiseSnapshot: CruiseSnapshot,
  folderColors: ReadonlyMap<string, string>,
): Node {
  const label = getBaseName(node.path);
  const sharedParent = {
    parentId: parentId ?? undefined,
    position: { ...node.position },
  };

  if (node.children) {
    const data: FolderGroupNodeData = {
      label,
      path: node.path,
      expanded: true,
      backgroundColor: folderColors.get(node.path) ?? 'rgba(0, 0, 0, 0.02)',
    };

    return {
      id: node.path,
      type: 'folderGroup',
      data,
      draggable: true,
      dragHandle: '.folder-group-header',
      zIndex: -1,
      style: {
        pointerEvents: 'none',
        width: node.width,
        height: node.height,
      },
      width: node.width,
      height: node.height,
      ...sharedParent,
    };
  }

  const snapshotNode = cruiseSnapshot.nodes.get(node.path);
  if (snapshotNode?.isFolder) {
    const data: FolderNodeData = {
      label,
      path: node.path,
      expanded: false,
      circular: node.valueCircular,
      backgroundColor: folderColors.get(node.path) ?? 'rgba(0, 0, 0, 0.02)',
    };

    return {
      id: node.path,
      type: 'folder',
      data,
      draggable: true,
      ...sharedParent,
      ...toNodeDimensions(node.width, node.height),
    };
  }

  const data: FileNodeData = {
    label,
    path: node.path,
    circular: node.valueCircular,
    couldNotResolve: Boolean(snapshotNode?.originModule?.couldNotResolve),
  };

  return {
    id: node.path,
    type: 'file',
    data,
    draggable: true,
    ...sharedParent,
    ...toNodeDimensions(node.width, node.height),
  };
}

/** Map a flat layouted-node index into React Flow nodes (parents before children). */
export function toReactFlowNodes(
  nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>,
  cruiseSnapshot: CruiseSnapshot,
  folderColors: ReadonlyMap<string, string>,
): ReactFlowGraphFromLayout {
  const { parentByNode } = buildAncestryIndex(nodes);
  const visibleNodeIds = new Set(nodes.keys());
  const depthById = new Map([...nodes.values()].map(node => [node.path, node.ancestors.length]));
  const rfNodes = [...nodes.values()].map(node =>
    createReactFlowNode(node, node.ancestors[0] ?? null, cruiseSnapshot, folderColors),
  );

  return {
    nodes: sortNodesByDepth(rfNodes, depthById),
    parentByNode,
    visibleNodeIds,
  };
}

/** Project App routable edges to React Flow edges (late presentation adapter). */
export function toReactFlowEdges(routableEdges: readonly RoutableEdge[]): Edge[] {
  return routableEdges.map(edge => {
    const { id, source, target, ...data } = edge;

    return {
      id,
      type: 'dependency',
      source,
      target,
      interactionWidth: 3,
      data: data as DependencyEdgeData,
    };
  });
}
