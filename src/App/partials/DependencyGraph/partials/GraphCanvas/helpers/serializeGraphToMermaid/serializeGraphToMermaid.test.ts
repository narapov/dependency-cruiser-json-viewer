import { describe, expect, it } from 'vitest';

import type { Edge, Node } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';

import {
  DEFAULT_EXPORT_NODE_BORDER,
  DEFAULT_EXPORT_NODE_BORDER_WIDTH,
  resolveExportEdgeStyle,
  resolveExportFileNodeColors,
  toExportColor,
} from '../toExportColor';
import {
  encodePathForMermaidId,
  escapeMermaidLabel,
  quoteMermaidLabel,
  serializeGraphToMermaid,
  toMermaidCurve,
  toMermaidCurveInit,
  toMermaidHighlightEdgeClass,
  toMermaidNodeId,
  toMermaidSubgraphId,
} from './serializeGraphToMermaid';

const DEFAULT_EDGES_TYPE: GraphEdgesType = 'bezier';

function fileNode(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    type: 'file',
    position: { x: 0, y: 0 },
    width: 120,
    height: 40,
    data: { label: id.split('/').at(-1) ?? id, path: id },
    ...overrides,
  };
}

function folderNode(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    type: 'folder',
    position: { x: 0, y: 0 },
    width: 120,
    height: 40,
    data: {
      label: id.split('/').at(-1) ?? id,
      path: id,
      backgroundColor: 'hsl(200, 48%, 26%)',
      expanded: false,
    },
    ...overrides,
  };
}

function folderGroupNode(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    type: 'folderGroup',
    position: { x: 0, y: 0 },
    width: 200,
    height: 120,
    data: {
      label: id.split('/').at(-1) ?? id,
      path: id,
      backgroundColor: 'hsl(200, 70%, 90%)',
      expanded: true,
    },
    ...overrides,
  };
}

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

describe('encodePathForMermaidId / toMermaidNodeId / toMermaidSubgraphId', () => {
  it('keeps slash vs underscore paths distinct', () => {
    expect(encodePathForMermaidId('src/App')).not.toBe(encodePathForMermaidId('src_App'));
    expect(toMermaidNodeId('src/App')).toBe(`n_${encodePathForMermaidId('src/App')}`);
    expect(toMermaidSubgraphId('src/App')).toBe(`sg_${encodePathForMermaidId('src/App')}`);
  });

  it('produces alphanumeric-safe ids for reserved-looking path segments', () => {
    expect(toMermaidNodeId('src/default.ts')).toMatch(/^n_\w+$/);
    expect(toMermaidNodeId('end')).toMatch(/^n_\w+$/);
    expect(toMermaidNodeId('src/default.ts')).not.toContain('/');
  });
});

describe('escapeMermaidLabel / quoteMermaidLabel', () => {
  it('escapes quotes and hashes for Mermaid quoted labels', () => {
    expect(escapeMermaidLabel('a"b#c')).toBe('a#quot;b#35;c');
    expect(quoteMermaidLabel('a.ts')).toBe('["a.ts"]');
  });
});

describe('toMermaidCurve', () => {
  it('maps GraphEdgesType to Mermaid flowchart curve values', () => {
    expect(toMermaidCurve('bezier')).toBe('basis');
    expect(toMermaidCurve('straight')).toBe('linear');
    expect(toMermaidCurve('simpleOrthogonal')).toBe('step');
    expect(toMermaidCurve('libavoidOrthogonal')).toBe('step');
  });
});

describe('serializeGraphToMermaid', () => {
  it('starts with init curve then flowchart LR and emits nested subgraphs with basename labels', () => {
    const nodes: Node[] = [
      folderGroupNode('src', {
        data: { label: 'src', path: 'src', backgroundColor: 'hsl(200, 70%, 90%)', expanded: true },
      }),
      folderGroupNode('src/app', {
        parentId: 'src',
        data: { label: 'app', path: 'src/app', backgroundColor: 'hsl(120, 70%, 90%)', expanded: true },
      }),
      fileNode('src/app/a.ts', {
        parentId: 'src/app',
        data: { label: 'a.ts', path: 'src/app/a.ts' },
      }),
    ];

    const mermaid = serializeGraphToMermaid({
      nodes,
      edges: [],
      userEdgeHighlights: new Map(),
      edgesType: DEFAULT_EDGES_TYPE,
    });

    expect(mermaid.startsWith(`${toMermaidCurveInit('bezier')}\nflowchart LR\n`)).toBe(true);
    expect(mermaid).toContain(`subgraph ${toMermaidSubgraphId('src')}${quoteMermaidLabel('src')}`);
    expect(mermaid).toContain(`subgraph ${toMermaidSubgraphId('src/app')}${quoteMermaidLabel('app')}`);
    expect(mermaid).toContain(`${toMermaidNodeId('src/app/a.ts')}${quoteMermaidLabel('a.ts')}`);
    expect(mermaid).toContain('end');
    expect(mermaid).toContain(
      `style ${toMermaidSubgraphId('src')} fill:${toExportColor('hsl(200, 70%, 90%)')},stroke:${DEFAULT_EXPORT_NODE_BORDER},stroke-width:${DEFAULT_EXPORT_NODE_BORDER_WIDTH}px`,
    );
  });

  it.each([
    ['bezier', 'basis'],
    ['straight', 'linear'],
    ['simpleOrthogonal', 'step'],
    ['libavoidOrthogonal', 'step'],
  ] as const)('maps edgesType %s to init flowchart.curve %s', (edgesType, curve) => {
    const mermaid = serializeGraphToMermaid({
      nodes: [fileNode('a.ts')],
      edges: [],
      userEdgeHighlights: new Map(),
      edgesType,
    });

    expect(mermaid.startsWith(`%%{init: {'flowchart': {'curve': '${curve}'}}}%%\nflowchart LR\n`)).toBe(true);
  });

  it('exports collapsed folders as styled leaves with lifted edges', () => {
    const nodes: Node[] = [
      fileNode('src/a.ts', { data: { label: 'a.ts', path: 'src/a.ts' } }),
      folderNode('src/lib', {
        data: { label: 'lib', path: 'src/lib', backgroundColor: 'hsl(40, 42%, 24%)', expanded: false },
      }),
    ];
    const edges = [edgeAt('src/a.ts', 'src/lib')];

    const mermaid = serializeGraphToMermaid({
      nodes,
      edges,
      userEdgeHighlights: new Map(),
      edgesType: DEFAULT_EDGES_TYPE,
    });

    expect(mermaid).toContain(`${toMermaidNodeId('src/lib')}${quoteMermaidLabel('lib')}`);
    expect(mermaid).toContain(`  ${toMermaidNodeId('src/a.ts')} e0@--> ${toMermaidNodeId('src/lib')}`);
    expect(mermaid).toContain(
      `style ${toMermaidNodeId('src/lib')} fill:${toExportColor('hsl(40, 42%, 24%)')},stroke:${DEFAULT_EXPORT_NODE_BORDER},stroke-width:${DEFAULT_EXPORT_NODE_BORDER_WIDTH}px`,
    );
    expect(mermaid).not.toContain(`subgraph ${toMermaidSubgraphId('src/lib')}`);
  });

  it('styles circular and unresolved files with classDef', () => {
    const nodes: Node[] = [
      fileNode('a.ts', { data: { label: 'a.ts', path: 'a.ts', circular: true } }),
      fileNode('missing', { data: { label: 'missing', path: 'missing', couldNotResolve: true } }),
    ];
    const circular = resolveExportFileNodeColors({ label: 'a.ts', path: 'a.ts', circular: true });
    const unresolved = resolveExportFileNodeColors({
      label: 'missing',
      path: 'missing',
      couldNotResolve: true,
    });

    const mermaid = serializeGraphToMermaid({
      nodes,
      edges: [],
      userEdgeHighlights: new Map(),
      edgesType: DEFAULT_EDGES_TYPE,
    });

    expect(mermaid).toContain(
      `classDef fileCircular fill:${circular.fill},stroke:${circular.border},stroke-width:${DEFAULT_EXPORT_NODE_BORDER_WIDTH}px`,
    );
    expect(mermaid).toContain(
      `classDef fileUnresolved fill:${unresolved.fill},stroke:${unresolved.border},stroke-width:${DEFAULT_EXPORT_NODE_BORDER_WIDTH}px`,
    );
    expect(mermaid).toContain(`class ${toMermaidNodeId('a.ts')} fileCircular`);
    expect(mermaid).toContain(`class ${toMermaidNodeId('missing')} fileUnresolved`);
  });

  it('uses safe ids for path-like and reserved names while keeping basename labels', () => {
    const nodes: Node[] = [
      fileNode('src/default.ts', { data: { label: 'default.ts', path: 'src/default.ts' } }),
      fileNode('end', { data: { label: 'end', path: 'end' } }),
    ];
    const edges = [edgeAt('src/default.ts', 'end')];

    const mermaid = serializeGraphToMermaid({
      nodes,
      edges,
      userEdgeHighlights: new Map(),
      edgesType: DEFAULT_EDGES_TYPE,
    });

    expect(mermaid).toContain(`${toMermaidNodeId('src/default.ts')}${quoteMermaidLabel('default.ts')}`);
    expect(mermaid).toContain(`${toMermaidNodeId('end')}${quoteMermaidLabel('end')}`);
    expect(mermaid).toContain(`  ${toMermaidNodeId('src/default.ts')} e0@--> ${toMermaidNodeId('end')}`);
    expect(mermaid).not.toMatch(/(?:^|\s)src\/default\.ts(?:\s|$)/);
  });

  it('emits edge ids with semantic classDef colors', () => {
    const nodes: Node[] = [fileNode('a.ts'), fileNode('b.ts'), fileNode('c.ts'), fileNode('d.ts')];
    const edges = [
      edgeAt('a.ts', 'b.ts', { data: { typeOnly: false, valueCircular: true } }),
      edgeAt('b.ts', 'c.ts', { data: { typeOnly: false, valueCircular: false, severity: 'warn' } }),
      edgeAt('c.ts', 'd.ts', { data: { typeOnly: false, valueCircular: false } }),
    ];
    const circular = resolveExportEdgeStyle(edges[0]!, new Map());
    const warn = resolveExportEdgeStyle(edges[1]!, new Map());

    const mermaid = serializeGraphToMermaid({
      nodes,
      edges,
      userEdgeHighlights: new Map(),
      edgesType: DEFAULT_EDGES_TYPE,
    });

    expect(mermaid).toContain(`classDef edgeCircular stroke:${circular.stroke}`);
    expect(mermaid).toContain(`classDef edgeWarn stroke:${warn.stroke}`);
    expect(mermaid).toContain('class e0 edgeCircular');
    expect(mermaid).toContain('class e1 edgeWarn');
    expect(mermaid).toContain('class e2 edgeDefault');
  });

  it('dashes type-only edges and applies highlight override with thicker stroke', () => {
    const nodes: Node[] = [fileNode('a.ts'), fileNode('b.ts'), fileNode('c.ts')];
    const edges = [
      edgeAt('a.ts', 'b.ts', {
        data: {
          typeOnly: true,
          valueCircular: false,
          aggregated: [{ id: 'a.ts->b.ts', source: 'a.ts', target: 'b.ts' }],
        },
      }),
      edgeAt('b.ts', 'c.ts', {
        data: {
          typeOnly: false,
          valueCircular: true,
          aggregated: [{ id: 'b.ts->c.ts', source: 'b.ts', target: 'c.ts' }],
        },
      }),
    ];
    const highlights = new Map([['b.ts->c.ts', '#00ff00']]);
    const typeOnly = resolveExportEdgeStyle(edges[0]!, new Map());
    const highlight = resolveExportEdgeStyle(edges[1]!, highlights);

    const mermaid = serializeGraphToMermaid({
      nodes,
      edges,
      userEdgeHighlights: highlights,
      edgesType: DEFAULT_EDGES_TYPE,
    });

    expect(mermaid).toContain(`stroke-dasharray:${typeOnly.strokeDasharray}`);
    expect(mermaid).toContain('classDef edgeDefaultTypeOnly');
    expect(mermaid).toContain(`classDef ${toMermaidHighlightEdgeClass('#00ff00')}`);
    expect(mermaid).toContain(`stroke-width:${highlight.strokeWidth}px`);
    expect(mermaid).toContain(`class e1 ${toMermaidHighlightEdgeClass('#00ff00')}`);
    expect(mermaid).not.toContain('class e1 edgeCircular');
  });
});
