import { hsl } from 'd3-color';

import type { Edge } from '@xyflow/react';

import { parsePastelHsl } from '../../../../../../helpers/assignFolderColors';
import type { DependencyEdgeData, FileNodeData } from '../../types';

/** Fallback fill when a UI color cannot be parsed for export. */
export const DEFAULT_EXPORT_FILE_FILL = '#ffffff';

export const DEFAULT_EXPORT_NODE_BORDER = '#666666';
/** Border width for exported leaf nodes and folder groups (DOT `penwidth` / Mermaid `stroke-width` px). */
export const DEFAULT_EXPORT_NODE_BORDER_WIDTH = 1;
export const DEFAULT_EXPORT_FONT_COLOR = '#000000';

const CIRCULAR_NODE_FILL = '#fff1f0';
const UNRESOLVED_NODE_FILL = '#ff0000';
const ERROR_NODE_BORDER = '#ff4d4f';

const DEFAULT_EDGE_HEX = '#b1b1b7';
const CIRCULAR_EDGE_HEX = '#ff4d4f';
const TYPE_ONLY_CIRCULAR_EDGE_HEX = '#ffa39e';
const ERROR_EDGE_HEX = '#ff4d4f';
const WARNING_EDGE_HEX = '#faad14';

const TYPE_ONLY_STROKE_DASHARRAY = '6 4';
const HIGHLIGHT_EDGE_STROKE_WIDTH_PX = 3;

/** Minimum lightness for exported fills so nodes stay readable on dark viewers. */
const MIN_EXPORT_FILL_LIGHTNESS = 85;

export type ExportFileNodeKind = 'default' | 'circular' | 'unresolved';

export interface ExportFileNodeColors {
  fill: string;
  border: string;
  kind: ExportFileNodeKind;
}

export type ExportEdgeKind = 'default' | 'error' | 'circular' | 'typeOnlyCircular' | 'warn' | 'highlight';

export interface ExportEdgeStyle {
  stroke: string;
  strokeWidth: number;
  dashed: boolean;
  /** Set when `dashed` is true. */
  strokeDasharray?: string;
  kind: ExportEdgeKind;
  /** Present when `kind` is `highlight` — normalized export hex used for class naming. */
  highlightHex?: string;
}

/** Converts HSL components to a `#rrggbb` hex color. */
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  return hsl(hue, saturation / 100, lightness / 100).formatHex();
}

/**
 * Normalizes a UI color to an export-safe hex string (DOT / Mermaid).
 * HSL pastels are converted; dark fills are lightened for readability.
 */
export function toExportColor(color: string): string {
  if (color.startsWith('#') && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color)) {
    const normalized =
      color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
    return normalized.toLowerCase();
  }

  const parsed = parsePastelHsl(color);
  if (!parsed) {
    return DEFAULT_EXPORT_FILE_FILL;
  }

  return hslToHex(parsed.hue, parsed.saturation, Math.max(parsed.lightness, MIN_EXPORT_FILL_LIGHTNESS));
}

/** Resolves export fill/border for a file node (circular / unresolved / default). */
export function resolveExportFileNodeColors(data: FileNodeData | undefined): ExportFileNodeColors {
  if (data?.couldNotResolve === true) {
    return { fill: UNRESOLVED_NODE_FILL, border: ERROR_NODE_BORDER, kind: 'unresolved' };
  }
  if (data?.circular === true) {
    return { fill: CIRCULAR_NODE_FILL, border: ERROR_NODE_BORDER, kind: 'circular' };
  }
  return { fill: DEFAULT_EXPORT_FILE_FILL, border: DEFAULT_EXPORT_NODE_BORDER, kind: 'default' };
}

/** Resolves export fill for a folder / folder-group background color. */
export function resolveExportFolderFill(rawColor: string | undefined): string {
  return rawColor ? toExportColor(rawColor) : DEFAULT_EXPORT_FILE_FILL;
}

function resolveUserHighlightColor(edge: Edge, userEdgeHighlights: ReadonlyMap<string, string>): string | undefined {
  const data = edge.data as DependencyEdgeData | undefined;
  const dependencyKeys = data?.aggregated?.map(dep => dep.id) ?? [];
  return dependencyKeys.map(key => userEdgeHighlights.get(key)).find((color): color is string => color != null);
}

function resolveBaseEdgeAppearance(data: DependencyEdgeData | undefined): {
  stroke: string;
  strokeWidth: number;
  kind: Exclude<ExportEdgeKind, 'highlight'>;
} {
  if (data?.couldNotResolve === true || data?.severity === 'error') {
    return { stroke: ERROR_EDGE_HEX, strokeWidth: 2, kind: 'error' };
  }
  if (data?.valueCircular === true) {
    return { stroke: CIRCULAR_EDGE_HEX, strokeWidth: 2, kind: 'circular' };
  }
  if (data?.typeOnlyCircular === true) {
    return { stroke: TYPE_ONLY_CIRCULAR_EDGE_HEX, strokeWidth: 2, kind: 'typeOnlyCircular' };
  }
  if (data?.severity === 'warn') {
    return { stroke: WARNING_EDGE_HEX, strokeWidth: 2, kind: 'warn' };
  }
  return { stroke: DEFAULT_EDGE_HEX, strokeWidth: 1, kind: 'default' };
}

/**
 * Resolves export stroke style for a dependency edge (semantic color, type-only dash, user highlight).
 */
export function resolveExportEdgeStyle(edge: Edge, userEdgeHighlights: ReadonlyMap<string, string>): ExportEdgeStyle {
  const data = edge.data as DependencyEdgeData | undefined;
  const dashed = data?.typeOnly === true;
  const highlightColor = resolveUserHighlightColor(edge, userEdgeHighlights);

  if (highlightColor) {
    const highlightHex = toExportColor(highlightColor);
    return {
      stroke: highlightHex,
      strokeWidth: HIGHLIGHT_EDGE_STROKE_WIDTH_PX,
      dashed,
      ...(dashed ? { strokeDasharray: TYPE_ONLY_STROKE_DASHARRAY } : {}),
      kind: 'highlight',
      highlightHex,
    };
  }

  const base = resolveBaseEdgeAppearance(data);
  return {
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
    dashed,
    ...(dashed ? { strokeDasharray: TYPE_ONLY_STROKE_DASHARRAY } : {}),
    kind: base.kind,
  };
}
