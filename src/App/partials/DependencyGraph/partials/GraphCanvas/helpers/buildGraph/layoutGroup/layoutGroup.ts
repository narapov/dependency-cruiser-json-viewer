import ELK from 'elkjs/lib/elk.bundled.js';

import { getBaseName, getEdgesAmongNodePaths, type CruiseSnapshot, type VisibleTreeNode } from '@/domain';

import type { VisibleTreeLayoutedNode } from '../../../types';
import { getLeafNodeSize, LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../../getLeafNodeSize';
import { groupMembershipMatches } from '../../layoutCache/groupMembership';
import type { GroupId, LayoutCache } from '../../layoutCache/types';
import type { BuildGraphProfiler } from '../createBuildGraphProfiler';
import { GROUP_HEADER, GROUP_PADDING } from '../layoutConstants';
import { settleOverlapsTopDown } from '../settleOverlapsTopDown';
import type { NodeSize } from '../types';

const NODE_HEIGHT = LEAF_NODE_HEIGHT;

const elk = new ELK();

interface LayoutEdge {
  source: string;
  target: string;
  weight: number;
}

interface SiblingLayoutResult {
  layouted: VisibleTreeLayoutedNode[];
  groupSize: NodeSize;
}

function getLayoutSpacing(childCount: number) {
  return {
    nodesep: Math.min(80, 24 + childCount * 2),
    ranksep: Math.min(160, 60 + childCount * 4),
  };
}

function emptyGroupSize(): NodeSize {
  return {
    width: LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2,
    height: GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING * 2,
  };
}

function sizeFromChildrenBounds(children: readonly VisibleTreeLayoutedNode[]): NodeSize {
  const { maxX, maxY } = children.reduce(
    (bounds, child) => ({
      maxX: Math.max(bounds.maxX, child.position.x + child.width),
      maxY: Math.max(bounds.maxY, child.position.y + child.height),
    }),
    { maxX: 0, maxY: 0 },
  );

  return {
    width: Math.max(maxX + GROUP_PADDING, LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2),
    height: Math.max(maxY + GROUP_PADDING, GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING),
  };
}

function buildLayoutEdgesForChildren(
  cruiseSnapshot: CruiseSnapshot,
  childIds: readonly string[],
  selectedFilePaths: Record<string, boolean | undefined>,
): LayoutEdge[] {
  return getEdgesAmongNodePaths(cruiseSnapshot, childIds, selectedFilePaths).map(edge => ({
    source: edge.source,
    target: edge.target,
    weight: edge.aggregated.length,
  }));
}

async function layoutChildrenWithElk(
  childIds: string[],
  childSizes: Map<string, NodeSize>,
  layoutEdges: LayoutEdge[],
  profiler?: BuildGraphProfiler,
): Promise<Map<string, { x: number; y: number }>> {
  const spacing = getLayoutSpacing(childIds.length);
  const childSet = new Set(childIds);
  const edges = layoutEdges
    .filter(edge => childSet.has(edge.source) && childSet.has(edge.target))
    .map((edge, index) => ({
      id: `e${index}-${edge.source}->${edge.target}`,
      sources: [edge.source],
      targets: [edge.target],
      layoutOptions: {
        // How important it is to keep this edge axis-aligned. int ≥ 0; higher = straighter.
        'elk.layered.priority.straightness': String(edge.weight),
        // How important it is to keep this edge short. int ≥ 0; higher = prefer shorter routes.
        'elk.layered.priority.shortness': String(edge.weight),
      },
    }));

  profiler?.start('elk.layout');
  const layouted = await elk.layout({
    id: 'root',
    layoutOptions: {
      // Layout algorithm. We use layered (Sugiyama); other ELK algorithms exist (e.g. force, mrtree).
      'elk.algorithm': 'layered',
      // Overall edge flow direction. Values: UNDEFINED | RIGHT | LEFT | DOWN | UP.
      'elk.direction': 'RIGHT',
      // Edge routing style. Values: UNDEFINED | POLYLINE | ORTHOGONAL | SPLINES.
      'elk.edgeRouting': 'SPLINES',
      // Layout disconnected subgraphs separately. Values: true | false.
      'elk.separateConnectedComponents': 'true',
      // Crossing minimization heuristic. Values: LAYER_SWEEP | MEDIAN_LAYER_SWEEP | INTERACTIVE | NONE.
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      // Post-process swap heuristic after layer sweep. Values: ONE_SIDED | TWO_SIDED | OFF.
      'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
      // Run greedy switch only if graph size < threshold. int ≥ 0; 0 = always on. Default: 40.
      'elk.layered.crossingMinimization.greedySwitch.activationThreshold': '0',
      // Brandes–Köpf fixed alignment. Values: NONE | LEFTUP | RIGHTUP | LEFTDOWN | RIGHTDOWN | BALANCED.
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      // Extra edge straightening in BK placer. Values: NONE | IMPROVE_STRAIGHTNESS.
      'elk.layered.nodePlacement.bk.edgeStraightening': 'IMPROVE_STRAIGHTNESS',
      // Prefer straight edges over balanced placement. Values: true | false.
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
      // Layout effort / iteration budget. int ≥ 1; default 7.
      'elk.layered.thoroughness': '10',
      // Spacing between nodes in the same layer (vertical when direction is RIGHT).
      'elk.spacing.nodeNode': String(spacing.nodesep),
      // Spacing between edges and nodes.
      'elk.spacing.edgeNode': String(Math.max(12, spacing.nodesep * 0.4)),
      // Spacing between parallel edges.
      'elk.spacing.edgeEdge': '10',
      // Spacing between adjacent layers (horizontal when direction is RIGHT).
      'elk.layered.spacing.nodeNodeBetweenLayers': String(spacing.ranksep),
      // Spacing between edges and nodes across layers.
      'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.max(16, spacing.ranksep * 0.25)),
    },
    children: childIds.map(childId => {
      const size = childSizes.get(childId)!;
      return { id: childId, width: size.width, height: size.height };
    }),
    edges,
  });
  profiler?.end('elk.layout');

  return new Map(
    (layouted.children ?? []).map(child => [
      child.id,
      {
        x: (child.x ?? 0) + GROUP_PADDING,
        y: (child.y ?? 0) + GROUP_HEADER + GROUP_PADDING,
      },
    ]),
  );
}

/** Size a single visible node (recurse into expanded folders; leaves get label-based size). */
async function sizeVisibleNode(
  node: VisibleTreeNode,
  cruiseSnapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
  profiler: BuildGraphProfiler | undefined,
  layoutCache: LayoutCache | null,
): Promise<VisibleTreeLayoutedNode> {
  if (node.children) {
    const { layouted: children, groupSize } = await layoutSiblingGroup(
      node.children,
      cruiseSnapshot,
      selectedFilePaths,
      profiler,
      layoutCache,
      node.path,
    );

    return {
      path: node.path,
      ancestors: node.ancestors,
      descendants: node.descendants,
      valueCircular: node.valueCircular,
      typeOnlyCircular: node.typeOnlyCircular,
      children,
      position: { x: 0, y: 0 },
      width: groupSize.width,
      height: groupSize.height,
    };
  }

  const isFolder = Boolean(cruiseSnapshot.nodes.get(node.path)?.isFolder);
  const size = getLeafNodeSize(getBaseName(node.path), isFolder ? 'folder' : 'file');

  return {
    path: node.path,
    ancestors: node.ancestors,
    descendants: node.descendants,
    valueCircular: node.valueCircular,
    typeOnlyCircular: node.typeOnlyCircular,
    position: { x: 0, y: 0 },
    width: size.width,
    height: size.height,
  };
}

/**
 * Applies cached child positions when membership matches, then settles sibling overlaps
 * top-down so grown children do not leave lower siblings overlapped.
 */
function applyCachedGroupLayout(
  children: readonly VisibleTreeLayoutedNode[],
  cache: LayoutCache,
  groupId: GroupId,
): SiblingLayoutResult | null {
  const entry = cache.get(groupId);
  const childIds = children.map(child => child.path);
  if (!groupMembershipMatches(entry, childIds)) {
    return null;
  }

  const settleItems = children.map(child => {
    const cachedChild = entry!.children.get(child.path);
    return {
      id: child.path,
      position: cachedChild ? { ...cachedChild.position } : { ...child.position },
      width: child.width,
      height: child.height,
    };
  });
  settleOverlapsTopDown(settleItems);

  const layouted = children.map((child, index) => ({
    ...child,
    position: { ...settleItems[index]!.position },
  }));

  const contentSize = sizeFromChildrenBounds(layouted);
  return {
    layouted,
    groupSize: {
      width: Math.max(contentSize.width, entry!.width),
      height: Math.max(contentSize.height, entry!.height),
    },
  };
}

/** Place already-sized siblings with cache or ELK; returns new nodes with positions. */
async function placeSiblings(
  sizedSiblings: readonly VisibleTreeLayoutedNode[],
  cruiseSnapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
  profiler: BuildGraphProfiler | undefined,
  layoutCache: LayoutCache | null,
  groupId: GroupId,
): Promise<SiblingLayoutResult> {
  if (layoutCache) {
    const cached = applyCachedGroupLayout(sizedSiblings, layoutCache, groupId);
    if (cached) {
      return cached;
    }
  }

  const childIds = sizedSiblings.map(child => child.path);
  const childSizes = new Map(sizedSiblings.map(child => [child.path, { width: child.width, height: child.height }]));
  const layoutEdges = buildLayoutEdgesForChildren(cruiseSnapshot, childIds, selectedFilePaths);
  const positions = await layoutChildrenWithElk(childIds, childSizes, layoutEdges, profiler);

  const layouted = sizedSiblings.map(child => ({
    ...child,
    position: positions.get(child.path)!,
  }));

  return {
    layouted,
    groupSize: sizeFromChildrenBounds(layouted),
  };
}

/**
 * Recursively layout sibling visible nodes into new layouted nodes (ELK or cache).
 *
 * Layout algorithm (recursive, per folder level):
 *
 * 1. Recurse into expanded children to produce sized layouted children.
 * 2. If the layout cache membership matches this group, apply cached relative positions,
 *    then cascade-settle sibling overlaps (vertical push-down).
 * 3. Otherwise cold-layout siblings with ELK layered (RIGHT).
 */
async function layoutSiblingGroup(
  siblings: readonly VisibleTreeNode[],
  cruiseSnapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
  profiler: BuildGraphProfiler | undefined,
  layoutCache: LayoutCache | null,
  groupId: GroupId,
): Promise<SiblingLayoutResult> {
  if (siblings.length === 0) {
    return { layouted: [], groupSize: emptyGroupSize() };
  }

  const sizedSiblings = await siblings.reduce<Promise<VisibleTreeLayoutedNode[]>>(async (previous, sibling) => {
    const laidOut = await previous;
    const sized = await sizeVisibleNode(sibling, cruiseSnapshot, selectedFilePaths, profiler, layoutCache);
    return [...laidOut, sized];
  }, Promise.resolve([]));

  return placeSiblings(sizedSiblings, cruiseSnapshot, selectedFilePaths, profiler, layoutCache, groupId);
}

/**
 * Pure layout: visible tree in → new layouted roots with sizes and positions.
 * Shares `ancestors` / `descendants` references from the input visible nodes.
 */
export async function layoutVisibleTree(
  visibleTree: readonly VisibleTreeNode[],
  cruiseSnapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
  profiler?: BuildGraphProfiler,
  layoutCache: LayoutCache | null = null,
): Promise<VisibleTreeLayoutedNode[]> {
  const { layouted } = await layoutSiblingGroup(
    visibleTree,
    cruiseSnapshot,
    selectedFilePaths,
    profiler,
    layoutCache,
    null,
  );
  return layouted;
}
