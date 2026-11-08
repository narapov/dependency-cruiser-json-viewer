import { describe, expect, it } from 'vitest';

import type { Edge } from '@xyflow/react';

import {
  DEFAULT_EXPORT_NODE_BORDER_WIDTH,
  hslToHex,
  resolveExportEdgeStyle,
  resolveExportFileNodeColors,
  resolveExportFolderFill,
  toExportColor,
} from './toExportColor';

function edgeAt(source: string, target: string, overrides: Partial<Edge> = {}): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'dependency',
    data: { typeOnly: false, valueCircular: false },
    ...overrides,
  };
}

describe('export node border width', () => {
  it('exposes a shared numeric width for DOT penwidth and Mermaid stroke-width', () => {
    expect(DEFAULT_EXPORT_NODE_BORDER_WIDTH).toBe(1);
  });
});

describe('toExportColor / hslToHex', () => {
  it('converts hsl pastels to light hex for export', () => {
    expect(toExportColor('hsl(200, 70%, 90%)')).toMatch(/^#[0-9a-f]{6}$/);
    expect(toExportColor('hsl(200, 48%, 26%)')).toMatch(/^#[0-9a-f]{6}$/);
    expect(toExportColor('hsl(0, 48%, 26%)')).toBe(hslToHex(0, 48, 85));
  });

  it('normalizes short and long hex colors', () => {
    expect(toExportColor('#AbC')).toBe('#aabbcc');
    expect(toExportColor('#ff4d4f')).toBe('#ff4d4f');
  });

  it('falls back to white for unparseable colors', () => {
    expect(toExportColor('not-a-color')).toBe('#ffffff');
  });
});

describe('resolveExportFileNodeColors / resolveExportFolderFill', () => {
  it('maps circular and unresolved file semantics', () => {
    expect(resolveExportFileNodeColors({ label: 'a', path: 'a', circular: true })).toMatchObject({
      kind: 'circular',
      fill: '#fff1f0',
      border: '#ff4d4f',
    });
    expect(resolveExportFileNodeColors({ label: 'm', path: 'm', couldNotResolve: true })).toMatchObject({
      kind: 'unresolved',
      fill: '#ff0000',
    });
    expect(resolveExportFileNodeColors({ label: 'a', path: 'a' }).kind).toBe('default');
  });

  it('normalizes folder pastel fills', () => {
    expect(resolveExportFolderFill(undefined)).toBe('#ffffff');
    expect(resolveExportFolderFill('hsl(40, 42%, 24%)')).toBe(toExportColor('hsl(40, 42%, 24%)'));
  });
});

describe('resolveExportEdgeStyle', () => {
  it('resolves semantic colors, type-only dash, and highlight override', () => {
    expect(resolveExportEdgeStyle(edgeAt('a', 'b', { data: { valueCircular: true } }), new Map())).toMatchObject({
      kind: 'circular',
      stroke: '#ff4d4f',
      strokeWidth: 2,
      dashed: false,
    });

    expect(
      resolveExportEdgeStyle(edgeAt('a', 'b', { data: { typeOnly: true, valueCircular: false } }), new Map()),
    ).toMatchObject({
      kind: 'default',
      dashed: true,
      strokeDasharray: '6 4',
    });

    expect(
      resolveExportEdgeStyle(
        edgeAt('a', 'b', {
          data: { valueCircular: true, aggregated: [{ id: 'a->b', source: 'a', target: 'b' }] },
        }),
        new Map([['a->b', '#00ff00']]),
      ),
    ).toMatchObject({
      kind: 'highlight',
      stroke: '#00ff00',
      strokeWidth: 3,
      highlightHex: '#00ff00',
    });
  });
});
