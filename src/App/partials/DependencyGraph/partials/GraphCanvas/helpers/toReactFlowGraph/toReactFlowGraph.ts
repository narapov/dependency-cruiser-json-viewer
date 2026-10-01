import type { Edge, Node } from '@xyflow/react';

import { getBaseName, type CruiseSnapshot, type VisibleTreeEdge } from '@/domain';

import type {
  DependencyEdgeData,
  FileNodeData,
  FolderGroupNodeData,
  FolderNodeData,
  VisibleTreeLayoutedNode,
} from '../../types';
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
    extent: parentId ? ('parent' as const) : undefined,
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

/** Build parent map from layouted-node children links (roots stay `null`). */
function buildParentByNode(nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>): Map<string, string | null> {
  const parentByNode = new Map<string, string | null>([...nodes.keys()].map(path => [path, null]));

  nodes.forEach(node => {
    node.children?.forEach(child => {
      parentByNode.set(child.path, node.path);
    });
  });

  return parentByNode;
}

/** Map a flat layouted-node index into React Flow nodes (parents before children). */
export function toReactFlowNodes(
  nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>,
  cruiseSnapshot: CruiseSnapshot,
  folderColors: ReadonlyMap<string, string>,
): ReactFlowGraphFromLayout {
  const parentByNode = buildParentByNode(nodes);
  const visibleNodeIds = new Set(nodes.keys());
  const rfNodes = [...nodes.values()].map(node =>
    createReactFlowNode(node, parentByNode.get(node.path) ?? null, cruiseSnapshot, folderColors),
  );

  return {
    nodes: sortNodesByDepth(rfNodes, cruiseSnapshot),
    parentByNode,
    visibleNodeIds,
  };
}

/** Map domain visible-tree edges to lightweight React Flow edges (data flags only). */
export function toReactFlowEdges(visibleEdges: readonly VisibleTreeEdge[]): Edge[] {
  return visibleEdges.map(edge => {
    const data: DependencyEdgeData = {
      typeOnly: edge.typeOnly,
      valueCircular: edge.valueCircular,
      typeOnlyCircular: edge.typeOnlyCircular,
      couldNotResolve: edge.violations.couldNotResolve,
      severity: edge.violations.severity ?? undefined,
      ruleNames: edge.violations.ruleNames.size > 0 ? [...edge.violations.ruleNames].sort() : undefined,
      aggregated: edge.aggregated.map(dep => ({
        id: dep.id,
        source: dep.source,
        target: dep.target,
      })),
    };

    return {
      id: edge.key,
      type: 'dependency',
      source: edge.source,
      target: edge.target,
      interactionWidth: 3,
      data,
    };
  });
}
