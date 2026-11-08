import type { Edge, Node } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';

import type { FileNodeData, FolderGroupNodeData, FolderNodeData } from '../../types';
import {
  DEFAULT_EXPORT_FONT_COLOR,
  DEFAULT_EXPORT_NODE_BORDER,
  DEFAULT_EXPORT_NODE_BORDER_WIDTH,
  resolveExportEdgeStyle,
  resolveExportFileNodeColors,
  resolveExportFolderFill,
  toExportColor,
  type ExportEdgeKind,
  type ExportEdgeStyle,
  type ExportFileNodeKind,
} from '../toExportColor';

export interface SerializeGraphToMermaidInput {
  nodes: readonly Node[];
  edges: readonly Edge[];
  userEdgeHighlights: ReadonlyMap<string, string>;
  edgesType: GraphEdgesType;
}

/** Maps workspace edges type to a Mermaid flowchart `curve` value. */
export function toMermaidCurve(edgesType: GraphEdgesType): string {
  switch (edgesType) {
    case 'straight':
      return 'linear';
    case 'simpleOrthogonal':
    case 'libavoidOrthogonal':
      return 'step';
    case 'bezier':
      return 'basis';
    default: {
      const _exhaustive: never = edgesType;
      return _exhaustive;
    }
  }
}

/** Builds the Mermaid init front-matter line for flowchart curve. */
export function toMermaidCurveInit(edgesType: GraphEdgesType): string {
  return `%%{init: {'flowchart': {'curve': '${toMermaidCurve(edgesType)}'}}}%%`;
}

const FILE_CLASS_BY_KIND: Record<ExportFileNodeKind, string> = {
  default: 'fileDefault',
  circular: 'fileCircular',
  unresolved: 'fileUnresolved',
};

const EDGE_CLASS_BY_KIND: Record<Exclude<ExportEdgeKind, 'highlight'>, string> = {
  default: 'edgeDefault',
  error: 'edgeError',
  circular: 'edgeCircular',
  typeOnlyCircular: 'edgeTypeOnlyCircular',
  warn: 'edgeWarn',
};

/**
 * Encodes a filesystem path into a Mermaid-safe identifier fragment.
 * Each non-alphanumeric character becomes `_` + hex codepoint + `_` so distinct paths stay unique.
 */
export function encodePathForMermaidId(path: string): string {
  return path
    .split('')
    .map(char => (/[A-Za-z0-9]/.test(char) ? char : `_${char.codePointAt(0)!.toString(16)}_`))
    .join('');
}

/** Builds a Mermaid-safe node id from a path (`n_` + encoded path). */
export function toMermaidNodeId(path: string): string {
  return `n_${encodePathForMermaidId(path)}`;
}

/** Builds a Mermaid-safe subgraph id from a path (`sg_` + encoded path). */
export function toMermaidSubgraphId(path: string): string {
  return `sg_${encodePathForMermaidId(path)}`;
}

/**
 * Escapes a string for inclusion inside a Mermaid double-quoted label.
 * Uses Mermaid entity codes for `"` and `#`.
 */
export function escapeMermaidLabel(value: string): string {
  return value.replace(/#/g, '#35;').replace(/"/g, '#quot;');
}

/** Formats a Mermaid quoted label (`["…"]`). */
export function quoteMermaidLabel(value: string): string {
  return `["${escapeMermaidLabel(value)}"]`;
}

/** Builds a Mermaid class name for a user highlight hex color. */
export function toMermaidHighlightEdgeClass(hex: string): string {
  return `edgeHl_${toExportColor(hex).replace(/^#/, '')}`;
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

function styleFillStroke(fill: string, stroke: string): string {
  return `fill:${fill},stroke:${stroke},stroke-width:${DEFAULT_EXPORT_NODE_BORDER_WIDTH}px,color:${DEFAULT_EXPORT_FONT_COLOR}`;
}

function addClassMember(members: Map<string, string[]>, className: string, memberId: string): void {
  const ids = members.get(className);
  if (!ids) {
    members.set(className, [memberId]);
    return;
  }
  ids.push(memberId);
}

function edgeClassDefLine(className: string, style: ExportEdgeStyle): string {
  const parts = [`stroke:${style.stroke}`, `stroke-width:${style.strokeWidth}px`];
  if (style.dashed && style.strokeDasharray) {
    parts.push(`stroke-dasharray:${style.strokeDasharray}`);
  }
  return `classDef ${className} ${parts.join(',')}`;
}

function toMermaidEdgeClassName(style: ExportEdgeStyle): string {
  if (style.kind === 'highlight') {
    return toMermaidHighlightEdgeClass(style.highlightHex ?? style.stroke);
  }
  const base = EDGE_CLASS_BY_KIND[style.kind];
  return style.dashed ? `${base}TypeOnly` : base;
}

function emitLeafNode(
  node: Node,
  indent: string,
  styleLines: string[],
  nodeClasses: Map<string, string[]>,
  fileClassDefs: Map<string, string>,
): string {
  const id = toMermaidNodeId(node.id);
  const line = `${indent}${id}${quoteMermaidLabel(getNodeLabel(node))}`;

  if (node.type === 'folder') {
    const fill = resolveExportFolderFill(getFolderFillColor(node));
    styleLines.push(`style ${id} ${styleFillStroke(fill, DEFAULT_EXPORT_NODE_BORDER)}`);
    return line;
  }

  if (node.type === 'file') {
    const colors = resolveExportFileNodeColors(node.data as FileNodeData | undefined);
    const className = FILE_CLASS_BY_KIND[colors.kind];
    fileClassDefs.set(className, `classDef ${className} ${styleFillStroke(colors.fill, colors.border)}`);
    addClassMember(nodeClasses, className, id);
  }

  return line;
}

function emitSubgraph(
  groupNode: Node,
  childrenByParent: ReadonlyMap<string | null, Node[]>,
  indent: string,
  styleLines: string[],
  nodeClasses: Map<string, string[]>,
  fileClassDefs: Map<string, string>,
): string[] {
  const subgraphId = toMermaidSubgraphId(groupNode.id);
  const lines = [`${indent}subgraph ${subgraphId}${quoteMermaidLabel(getNodeLabel(groupNode))}`];

  const rawFill = getFolderFillColor(groupNode);
  if (rawFill) {
    styleLines.push(
      `style ${subgraphId} ${styleFillStroke(resolveExportFolderFill(rawFill), DEFAULT_EXPORT_NODE_BORDER)}`,
    );
  }

  const children = childrenByParent.get(groupNode.id) ?? [];
  children.forEach(child => {
    if (child.type === 'folderGroup') {
      lines.push(...emitSubgraph(child, childrenByParent, `${indent}  `, styleLines, nodeClasses, fileClassDefs));
      return;
    }
    lines.push(emitLeafNode(child, `${indent}  `, styleLines, nodeClasses, fileClassDefs));
  });

  lines.push(`${indent}end`);
  return lines;
}

/** Serializes the visible React Flow graph to a Mermaid flowchart with DOT-parity colors (LR, nested subgraphs). */
export function serializeGraphToMermaid({
  nodes,
  edges,
  userEdgeHighlights,
  edgesType,
}: SerializeGraphToMermaidInput): string {
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

  const lines = [toMermaidCurveInit(edgesType), 'flowchart LR'];
  const styleLines: string[] = [];
  const nodeClasses = new Map<string, string[]>();
  const edgeClasses = new Map<string, string[]>();
  const classDefs = new Map<string, string>();
  const fileClassDefs = new Map<string, string>();

  const roots = childrenByParent.get(null) ?? [];
  roots.forEach(node => {
    if (node.type === 'folderGroup') {
      lines.push(...emitSubgraph(node, childrenByParent, '  ', styleLines, nodeClasses, fileClassDefs));
      return;
    }
    lines.push(emitLeafNode(node, '  ', styleLines, nodeClasses, fileClassDefs));
  });

  fileClassDefs.forEach((def, className) => {
    classDefs.set(className, def);
  });

  edges.forEach((edge, index) => {
    const edgeId = `e${index}`;
    lines.push(`  ${toMermaidNodeId(edge.source)} ${edgeId}@--> ${toMermaidNodeId(edge.target)}`);

    const style = resolveExportEdgeStyle(edge, userEdgeHighlights);
    const className = toMermaidEdgeClassName(style);
    classDefs.set(className, edgeClassDefLine(className, style));
    addClassMember(edgeClasses, className, edgeId);
  });

  const usedClassNames = new Set([...nodeClasses.keys(), ...edgeClasses.keys()]);
  usedClassNames.forEach(className => {
    const def = classDefs.get(className);
    if (def) {
      lines.push(def);
    }
  });

  nodeClasses.forEach((ids, className) => {
    lines.push(`class ${ids.join(',')} ${className}`);
  });

  edgeClasses.forEach((ids, className) => {
    lines.push(`class ${ids.join(',')} ${className}`);
  });

  styleLines.forEach(styleLine => {
    lines.push(styleLine);
  });

  return `${lines.join('\n')}\n`;
}
