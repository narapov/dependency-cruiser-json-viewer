import { hsl } from 'd3-color';

import type { Edge, Node } from '@xyflow/react';

import {
  CIRCULAR_EDGE_COLOR,
  DEFAULT_EDGE_COLOR,
  ERROR_EDGE_COLOR,
  TYPE_ONLY_CIRCULAR_EDGE_COLOR,
  WARNING_EDGE_COLOR,
} from '@/Shared';

import type { DependencyEdgeData, FileNodeData, FolderGroupNodeData, FolderNodeData } from '../../types';
import { parsePastelHsl } from '../assignFolderColors';
import { getNodeSize } from '../graphLayoutCache';

const PX_PER_INCH = 72;

/** Light-theme hex fallbacks — DOT cannot use CSS variables. */
const DEFAULT_EDGE_HEX = '#b1b1b7';
const CIRCULAR_EDGE_HEX = '#ff4d4f';
const TYPE_ONLY_CIRCULAR_EDGE_HEX = '#ffa39e';
const ERROR_EDGE_HEX = '#ff4d4f';
const WARNING_EDGE_HEX = '#faad14';
const DEFAULT_FILE_FILL = '#ffffff';
const DEFAULT_NODE_BORDER = '#666666';
const CIRCULAR_NODE_FILL = '#fff1f0';
const UNRESOLVED_NODE_FILL = '#ff0000';
const ERROR_NODE_BORDER = '#ff4d4f';
const DEFAULT_FONT_COLOR = '#000000';
/** Minimum lightness for exported fills so nodes stay readable on dark viewers. */
const MIN_EXPORT_FILL_LIGHTNESS = 85;

export interface SerializeGraphToDotInput {
  nodes: readonly Node[];
  edges: readonly Edge[];
  userEdgeHighlights: ReadonlyMap<string, string>;
  edgeDependencyKeyMap: ReadonlyMap<string, readonly string[]>;
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

/** Converts HSL components to a `#rrggbb` hex color. */
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  return hsl(hue, saturation / 100, lightness / 100).formatHex();
}

/**
 * Normalizes a UI color to a Graphviz-safe hex string.
 * HSL pastels are converted; dark fills are lightened for readability.
 */
export function toDotColor(color: string): string {
  if (color.startsWith('#') && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color)) {
    return color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color.toLowerCase();
  }

  const parsed = parsePastelHsl(color);
  if (parsed == null) {
    return DEFAULT_FILE_FILL;
  }

  return hslToHex(parsed.hue, parsed.saturation, Math.max(parsed.lightness, MIN_EXPORT_FILL_LIGHTNESS));
}

function formatInches(px: number): string {
  const inches = px / PX_PER_INCH;
  return String(Math.round(inches * 10000) / 10000);
}

function formatPoint(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function resolveEdgePenWidth(edge: Edge, highlighted: boolean): number {
  if (highlighted) {
    return 3;
  }
  if (typeof edge.style?.strokeWidth === 'number') {
    return edge.style.strokeWidth;
  }
  return 1;
}

function getAbsoluteOrigin(node: Node, nodeById: ReadonlyMap<string, Node>): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;

  while (parentId != null) {
    const parent = nodeById.get(parentId);
    if (parent == null) {
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

function resolveUserHighlightColor(
  edgeId: string,
  userEdgeHighlights: ReadonlyMap<string, string>,
  edgeDependencyKeyMap: ReadonlyMap<string, readonly string[]>,
): string | undefined {
  const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? [];
  return dependencyKeys.map(key => userEdgeHighlights.get(key)).find((color): color is string => color != null);
}

function resolveBaseEdgeColor(edge: Edge): string {
  const stroke = edge.style?.stroke;
  if (stroke === ERROR_EDGE_COLOR) {
    return ERROR_EDGE_HEX;
  }
  if (stroke === WARNING_EDGE_COLOR) {
    return WARNING_EDGE_HEX;
  }
  if (stroke === CIRCULAR_EDGE_COLOR) {
    return CIRCULAR_EDGE_HEX;
  }
  if (stroke === TYPE_ONLY_CIRCULAR_EDGE_COLOR) {
    return TYPE_ONLY_CIRCULAR_EDGE_HEX;
  }
  if (stroke === DEFAULT_EDGE_COLOR || stroke == null) {
    return DEFAULT_EDGE_HEX;
  }
  if (typeof stroke === 'string' && stroke.startsWith('#')) {
    return stroke;
  }
  return DEFAULT_EDGE_HEX;
}

function getNodeLabel(node: Node): string {
  const data = node.data as FileNodeData | FolderNodeData | FolderGroupNodeData | undefined;
  if (data != null && typeof data.label === 'string' && data.label.length > 0) {
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

function getFileNodeColors(data: FileNodeData | undefined): { fill: string; border: string } {
  if (data?.couldNotResolve === true) {
    return { fill: UNRESOLVED_NODE_FILL, border: ERROR_NODE_BORDER };
  }
  if (data?.circular === true) {
    return { fill: CIRCULAR_NODE_FILL, border: ERROR_NODE_BORDER };
  }
  return { fill: DEFAULT_FILE_FILL, border: DEFAULT_NODE_BORDER };
}

function emitLeafNode(node: Node, rect: AbsoluteRect, graphHeight: number, indent: string): string[] {
  const centerX = rect.x + rect.width / 2;
  const centerY = flipY(rect.y + rect.height / 2, graphHeight);
  const posValue = `${formatPoint(centerX)},${formatPoint(centerY)}!`;

  let fill = DEFAULT_FILE_FILL;
  let border = DEFAULT_NODE_BORDER;
  if (node.type === 'folder') {
    const rawFill = getFolderFillColor(node);
    fill = rawFill != null ? toDotColor(rawFill) : DEFAULT_FILE_FILL;
  } else if (node.type === 'file') {
    const colors = getFileNodeColors(node.data as FileNodeData | undefined);
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
    `fontcolor=${quoteDot(DEFAULT_FONT_COLOR)}`,
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
    `${indent}  fontcolor=${quoteDot(DEFAULT_FONT_COLOR)};`,
    `${indent}  color=${quoteDot(DEFAULT_NODE_BORDER)};`,
    `${indent}  graph [bb="${llx},${lly},${urx},${ury}"];`,
  ];

  if (rawFill != null) {
    lines.push(`${indent}  bgcolor=${quoteDot(toDotColor(rawFill))};`);
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

function emitEdge(
  edge: Edge,
  userEdgeHighlights: ReadonlyMap<string, string>,
  edgeDependencyKeyMap: ReadonlyMap<string, readonly string[]>,
  indent: string,
): string {
  const highlightColor = resolveUserHighlightColor(edge.id, userEdgeHighlights, edgeDependencyKeyMap);
  const color = highlightColor ?? resolveBaseEdgeColor(edge);
  const strokeWidth = resolveEdgePenWidth(edge, highlightColor != null);
  const attrs = [`color=${quoteDot(color)}`, `penwidth=${strokeWidth}`];

  const data = edge.data as DependencyEdgeData | undefined;
  if (data?.typeOnly === true) {
    attrs.push('style=dashed');
  }
  if (typeof data?.title === 'string' && data.title.length > 0) {
    attrs.push(`tooltip=${quoteDot(data.title)}`);
  }

  return `${indent}${quoteDot(edge.source)} -> ${quoteDot(edge.target)} [${attrs.join(', ')}];`;
}

/** Serializes the visible React Flow graph to Graphviz DOT with clusters, sizes, positions, and user edge highlights. */
export function serializeGraphToDot({
  nodes,
  edges,
  userEdgeHighlights,
  edgeDependencyKeyMap,
}: SerializeGraphToDotInput): string {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const childrenByParent = new Map<string | null, Node[]>();

  nodes.forEach(node => {
    const parentId = node.parentId ?? null;
    const siblings = childrenByParent.get(parentId);
    if (siblings == null) {
      childrenByParent.set(parentId, [node]);
      return;
    }
    siblings.push(node);
  });

  const absRects = nodes.map(node => getAbsoluteRect(node, nodeById));
  const graphWidth = absRects.reduce((max, rect) => Math.max(max, rect.x + rect.width), 0);
  const graphHeight = absRects.reduce((max, rect) => Math.max(max, rect.y + rect.height), 0);

  const lines = [
    '// Must use the nop2 engine — it respects precomputed node positions (pos).',
    '// Render with: neato -n2 -Tsvg graph.dot',
    '//        or:   dot -Knop2 -Tsvg graph.dot',
    'digraph {',
    `  graph [bb="0,0,${formatPoint(graphWidth)},${formatPoint(graphHeight)}", bgcolor=${quoteDot('#ffffff')}];`,
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
    lines.push(emitEdge(edge, userEdgeHighlights, edgeDependencyKeyMap, '  '));
  });

  lines.push('}');
  return `${lines.join('\n')}\n`;
}
