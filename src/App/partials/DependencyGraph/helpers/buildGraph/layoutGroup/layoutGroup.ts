import ELK from 'elkjs/lib/elk.bundled.js';

import { getEdgesAmongNodePaths, type CruiseSnapshot } from '@/domain';

import type { VisibleTreeLayoutedNode } from '../../../types';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../../getLeafNodeSize';
import type { BuildGraphProfiler } from '../createBuildGraphProfiler';
import { GROUP_HEADER, GROUP_PADDING } from '../layoutConstants';
import type { NodeSize } from '../types';

const NODE_HEIGHT = LEAF_NODE_HEIGHT;

const elk = new ELK();

interface LayoutEdge {
  source: string;
  target: string;
  weight: number;
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

/**
 * Recursively layout sibling nodes with ELK and write position/size onto the tree.
 *
 * Layout algorithm (recursive, per folder level):
 *
 * 1. Recurse into expanded children (`children` present) to compute their group sizes.
 * 2. Place siblings with ELK layered (RIGHT). Spacing scales with child count.
 *    Disconnected components are packed separately (`elk.separateConnectedComponents`)
 *    so sparse sibling sets do not collapse into a single column.
 *
 * Sibling edges come from `getEdgesAmongNodePaths` over the current children (same
 * algorithm as visible-tree edges). Edge weight biases crossing minimization and straightness.
 */
export async function layoutChildren(
  children: VisibleTreeLayoutedNode[],
  cruiseSnapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
  profiler?: BuildGraphProfiler,
): Promise<NodeSize> {
  if (children.length === 0) {
    return emptyGroupSize();
  }

  await children.reduce<Promise<void>>(async (previous, child) => {
    await previous;
    if (!child.children) {
      return;
    }
    const size = await layoutChildren(child.children, cruiseSnapshot, selectedFilePaths, profiler);
    child.width = size.width;
    child.height = size.height;
  }, Promise.resolve());

  const childIds = children.map(child => child.path);
  const childSizes = new Map(children.map(child => [child.path, { width: child.width, height: child.height }]));
  const layoutEdges = buildLayoutEdgesForChildren(cruiseSnapshot, childIds, selectedFilePaths);
  const positions = await layoutChildrenWithElk(childIds, childSizes, layoutEdges, profiler);

  const { maxX, maxY } = children.reduce(
    (bounds, child) => {
      const position = positions.get(child.path)!;
      child.position = position;
      return {
        maxX: Math.max(bounds.maxX, position.x + child.width),
        maxY: Math.max(bounds.maxY, position.y + child.height),
      };
    },
    { maxX: 0, maxY: 0 },
  );

  return {
    width: Math.max(maxX + GROUP_PADDING, LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2),
    height: Math.max(maxY + GROUP_PADDING, GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING),
  };
}
