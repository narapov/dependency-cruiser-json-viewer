import type { Edge, Node } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';

import type { DependencyEdgeData, FileNodeData, FolderGroupNodeData, FolderNodeData } from '../../types';
import { getDependencyEdgeVisualStyle } from '../getDependencyEdgeVisualStyle';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../getLeafNodeSize';
import {
  DEFAULT_EXPORT_FILE_FILL,
  DEFAULT_EXPORT_FONT_COLOR,
  DEFAULT_EXPORT_NODE_BORDER,
  DEFAULT_EXPORT_NODE_BORDER_WIDTH,
  resolveExportEdgeStyle,
  resolveExportFileNodeColors,
  resolveExportFolderFill,
  toExportColor,
} from '../toExportColor';

/** Reads a React Flow node's width and height from props or style, with leaf defaults. */
function getNodeSize(node: Node): { width: number; height: number } {
  const width = node.width ?? (typeof node.style?.width === 'number' ? node.style.width : LEAF_NODE_MIN_WIDTH);
  const height = node.height ?? (typeof node.style?.height === 'number' ? node.style.height : LEAF_NODE_HEIGHT);
  return { width, height };
}

const PX_PER_INCH = 72;

export interface SerializeGraphToDotInput {
  nodes: readonly Node[];
  edges: readonly Edge[];
  userEdgeHighlights: ReadonlyMap<string, string>;
  edgesType: GraphEdgesType;
}

/** Maps workspace edges type to a Graphviz graph-level `splines` value. */
export function toDotSplines(edgesType: GraphEdgesType): string {
  switch (edgesType) {
    case 'straight':
      return 'line';
    case 'simpleOrthogonal':
    case 'libavoidOrthogonal':
      return 'ortho';
    case 'bezier':
      return 'curved';
    default: {
      const _exhaustive: never = edgesType;
      return _exhaustive;
    }
  }
}

interface AbsoluteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Escapes a string for inclusion inside a DOT double-quoted literal. */
export function escapeDotString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/** Wraps a value in DOT double quotes with escaping. */
export function quoteDot(value: string): string {
  return `"${escapeDotString(value)}"`;
}

/** Graphviz cluster id (`cluster_` + path). Must be passed through quoteDot — paths may contain `/`. */
export function toClusterId(path: string): string {
  return `cluster_${path}`;
}

function formatInches(px: number): string {
  const inches = px / PX_PER_INCH;
  return String(Math.round(inches * 10000) / 10000);
}

function formatPoint(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function getAbsoluteOrigin(node: Node, nodeById: ReadonlyMap<string, Node>): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;

  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent) {
      break;
    }
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }

  return { x, y };
}

function getAbsoluteRect(node: Node, nodeById: ReadonlyMap<string, Node>): AbsoluteRect {
  const { x, y } = getAbsoluteOrigin(node, nodeById);
  const { width, height } = getNodeSize(node);
  return { x, y, width, height };
}

function flipY(y: number, graphHeight: number): number {
  return graphHeight - y;
}

function getNodeLabel(node: Node): string {
  const data = node.data as FileNodeData | FolderNodeData | FolderGroupNodeData | undefined;
  if (data && typeof data.label === 'string' && data.label.length > 0) {
    return data.label;
  }
  return node.id;
}

function getFolderFillColor(node: Node): string | undefined {
  if (node.type === 'folder') {
    return (node.data as FolderNodeData).backgroundColor;
  }
  if (node.type === 'folderGroup') {
    return (node.data as FolderGroupNodeData).backgroundColor;
  }
  return undefined;
}

function emitLeafNode(node: Node, rect: AbsoluteRect, graphHeight: number, indent: string): string[] {
  const centerX = rect.x + rect.width / 2;
  const centerY = flipY(rect.y + rect.height / 2, graphHeight);
  const posValue = `${formatPoint(centerX)},${formatPoint(centerY)}!`;

  let fill = DEFAULT_EXPORT_FILE_FILL;
  let border = DEFAULT_EXPORT_NODE_BORDER;
  if (node.type === 'folder') {
    fill = resolveExportFolderFill(getFolderFillColor(node));
  } else if (node.type === 'file') {
    const colors = resolveExportFileNodeColors(node.data as FileNodeData | undefined);
    fill = colors.fill;
    border = colors.border;
  }

  const attrs = [
    `label=${quoteDot(getNodeLabel(node))}`,
    `width=${formatInches(rect.width)}`,
    `height=${formatInches(rect.height)}`,
    'fixedsize=true',
    `pos=${quoteDot(posValue)}`,
    'shape=box',
    'style=filled',
    `fillcolor=${quoteDot(fill)}`,
    `color=${quoteDot(border)}`,
    `penwidth=${DEFAULT_EXPORT_NODE_BORDER_WIDTH}`,
    `fontcolor=${quoteDot(DEFAULT_EXPORT_FONT_COLOR)}`,
  ];

  return [`${indent}${quoteDot(node.id)} [${attrs.join(', ')}];`];
}

function emitCluster(
  groupNode: Node,
  childrenByParent: ReadonlyMap<string | null, Node[]>,
  nodeById: ReadonlyMap<string, Node>,
  graphHeight: number,
  indent: string,
): string[] {
  const rect = getAbsoluteRect(groupNode, nodeById);
  const llx = formatPoint(rect.x);
  const lly = formatPoint(flipY(rect.y + rect.height, graphHeight));
  const urx = formatPoint(rect.x + rect.width);
  const ury = formatPoint(flipY(rect.y, graphHeight));
  const rawFill = getFolderFillColor(groupNode);
  const clusterId = toClusterId(groupNode.id);
  const lines = [
    `${indent}subgraph ${quoteDot(clusterId)} {`,
    `${indent}  label=${quoteDot(getNodeLabel(groupNode))};`,
    `${indent}  fontcolor=${quoteDot(DEFAULT_EXPORT_FONT_COLOR)};`,
    `${indent}  color=${quoteDot(DEFAULT_EXPORT_NODE_BORDER)};`,
    `${indent}  penwidth=${DEFAULT_EXPORT_NODE_BORDER_WIDTH};`,
    `${indent}  graph [bb="${llx},${lly},${urx},${ury}"];`,
  ];

  if (rawFill) {
    lines.push(`${indent}  bgcolor=${quoteDot(toExportColor(rawFill))};`);
  }

  const children = childrenByParent.get(groupNode.id) ?? [];
  children.forEach(child => {
    if (child.type === 'folderGroup') {
      lines.push(...emitCluster(child, childrenByParent, nodeById, graphHeight, `${indent}  `));
      return;
    }
    lines.push(...emitLeafNode(child, getAbsoluteRect(child, nodeById), graphHeight, `${indent}  `));
  });

  lines.push(`${indent}}`);
  return lines;
}

function emitEdge(edge: Edge, userEdgeHighlights: ReadonlyMap<string, string>, indent: string): string {
  const style = resolveExportEdgeStyle(edge, userEdgeHighlights);
  const attrs = [`color=${quoteDot(style.stroke)}`, `penwidth=${style.strokeWidth}`];

  if (style.dashed) {
    attrs.push('style=dashed');
  }
  const title = getDependencyEdgeVisualStyle(
    edge.source,
    edge.target,
    edge.data as DependencyEdgeData | undefined,
  ).title;
  if (title.length > 0) {
    attrs.push(`tooltip=${quoteDot(title)}`);
  }

  return `${indent}${quoteDot(edge.source)} -> ${quoteDot(edge.target)} [${attrs.join(', ')}];`;
}

/** Serializes the visible React Flow graph to Graphviz DOT with clusters, sizes, positions, and user edge highlights. */
export function serializeGraphToDot({ nodes, edges, userEdgeHighlights, edgesType }: SerializeGraphToDotInput): string {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const childrenByParent = new Map<string | null, Node[]>();

  nodes.forEach(node => {
    const parentId = node.parentId ?? null;
    const siblings = childrenByParent.get(parentId);
    if (!siblings) {
      childrenByParent.set(parentId, [node]);
      return;
    }
    siblings.push(node);
  });

  const absRects = nodes.map(node => getAbsoluteRect(node, nodeById));
  const graphWidth = absRects.reduce((max, rect) => Math.max(max, rect.x + rect.width), 0);
  const graphHeight = absRects.reduce((max, rect) => Math.max(max, rect.y + rect.height), 0);
  const splines = toDotSplines(edgesType);

  const lines = [
    '// Must use the nop2 engine — it respects precomputed node positions (pos).',
    '// Render with: neato -n2 -Tsvg graph.dot',
    '//        or:   dot -Knop2 -Tsvg graph.dot',
    'digraph {',
    `  graph [bb="0,0,${formatPoint(graphWidth)},${formatPoint(graphHeight)}", bgcolor=${quoteDot('#ffffff')}, splines=${splines}];`,
  ];

  const roots = childrenByParent.get(null) ?? [];
  roots.forEach(node => {
    if (node.type === 'folderGroup') {
      lines.push(...emitCluster(node, childrenByParent, nodeById, graphHeight, '  '));
      return;
    }
    lines.push(...emitLeafNode(node, getAbsoluteRect(node, nodeById), graphHeight, '  '));
  });

  edges.forEach(edge => {
    lines.push(emitEdge(edge, userEdgeHighlights, '  '));
  });

  lines.push('}');
  return `${lines.join('\n')}\n`;
}
