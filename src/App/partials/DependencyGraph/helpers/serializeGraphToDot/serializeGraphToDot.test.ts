import { describe, expect, it } from 'vitest';

import { MarkerType, type Edge, type Node } from '@xyflow/react';

import {
  CIRCULAR_EDGE_COLOR,
  DEFAULT_EDGE_COLOR,
  ERROR_EDGE_COLOR,
  TYPE_ONLY_CIRCULAR_EDGE_COLOR,
  WARNING_EDGE_COLOR,
} from '@/Shared';

import {
  escapeDotString,
  hslToHex,
  quoteDot,
  serializeGraphToDot,
  toClusterId,
  toDotColor,
} from './serializeGraphToDot';

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
    data: { title: `${source} → ${target}`, typeOnly: false, circular: false },
    style: { stroke: DEFAULT_EDGE_COLOR, strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: DEFAULT_EDGE_COLOR },
    ...overrides,
  };
}

describe('escapeDotString / quoteDot', () => {
  it('escapes backslashes, quotes, and newlines', () => {
    expect(escapeDotString('a\\"b\nc')).toBe('a\\\\\\"b\\nc');
    expect(quoteDot('src/"a".ts')).toBe('"src/\\"a\\".ts"');
  });
});

describe('toClusterId / toDotColor / hslToHex', () => {
  it('prefixes path without collapsing slash vs underscore', () => {
    expect(toClusterId('src/App')).toBe('cluster_src/App');
    expect(toClusterId('src/foo')).not.toBe(toClusterId('src_foo'));
  });

  it('converts hsl pastels to light hex for Graphviz', () => {
    expect(toDotColor('hsl(200, 70%, 90%)')).toMatch(/^#[0-9a-f]{6}$/);
    expect(toDotColor('hsl(200, 48%, 26%)')).toMatch(/^#[0-9a-f]{6}$/);
    // Dark UI pastel is lightened for export readability
    expect(toDotColor('hsl(0, 48%, 26%)')).toBe(hslToHex(0, 48, 85));
  });
});

describe('serializeGraphToDot', () => {
  it('emits nested clusters with absolute bb and leaf sizes/positions', () => {
    const nodes: Node[] = [
      folderGroupNode('src', { position: { x: 10, y: 20 }, width: 300, height: 200 }),
      folderGroupNode('src/app', {
        parentId: 'src',
        position: { x: 16, y: 36 },
        width: 200,
        height: 120,
        data: {
          label: 'app',
          path: 'src/app',
          backgroundColor: 'hsl(120, 70%, 90%)',
          expanded: true,
        },
      }),
      fileNode('src/app/a.ts', {
        parentId: 'src/app',
        position: { x: 16, y: 36 },
        width: 144,
        height: 40,
        data: { label: 'a.ts', path: 'src/app/a.ts' },
      }),
    ];

    const dot = serializeGraphToDot({
      nodes,
      edges: [],
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(dot).toContain('// Must use the nop2 engine — it respects precomputed node positions (pos).');
    expect(dot).toContain('// Render with: neato -n2 -Tsvg graph.dot');
    expect(dot).toContain('//        or:   dot -Knop2 -Tsvg graph.dot');
    expect(dot).toContain('subgraph "cluster_src"');
    expect(dot).toContain('subgraph "cluster_src/app"');
    expect(dot).toContain(`bgcolor="${toDotColor('hsl(120, 70%, 90%)')}"`);
    expect(dot).not.toContain('hsl(');
    expect(dot).toContain('"src/app/a.ts"');
    expect(dot).toContain('width=2');
    expect(dot).toContain('height=0.5556');
    expect(dot).toContain('fixedsize=true');
    expect(dot).toMatch(/pos="[\d.]+,[\d.]+!"/);
  });

  it('exports collapsed folder nodes with readable hex fills', () => {
    const nodes = [
      folderGroupNode('src', { width: 300, height: 200 }),
      folderNode('src/App', {
        parentId: 'src',
        position: { x: 16, y: 36 },
        data: {
          label: 'App',
          path: 'src/App',
          backgroundColor: 'hsl(40, 42%, 24%)',
          expanded: false,
        },
      }),
    ];

    const dot = serializeGraphToDot({
      nodes,
      edges: [],
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(dot).toContain('"src/App" [label="App"');
    expect(dot).toContain(`fillcolor="${toDotColor('hsl(40, 42%, 24%)')}"`);
    expect(dot).toContain('fontcolor="#000000"');
    expect(dot).not.toContain('hsl(');
  });

  it('applies user highlight color and ignores base circular stroke when highlighted', () => {
    const nodes = [fileNode('a.ts', { position: { x: 0, y: 0 } }), fileNode('b.ts', { position: { x: 200, y: 0 } })];
    const edges = [
      edgeAt('a.ts', 'b.ts', {
        style: { stroke: CIRCULAR_EDGE_COLOR, strokeWidth: 2 },
        data: { title: 'a → b', typeOnly: false, circular: true },
      }),
    ];
    const depKey = 'a.ts->b.ts';

    const dot = serializeGraphToDot({
      nodes,
      edges,
      userEdgeHighlights: new Map([[depKey, '#e6194b']]),
      edgeDependencyKeyMap: new Map([['a.ts->b.ts', [depKey]]]),
    });

    expect(dot).toContain('"a.ts" -> "b.ts" [color="#e6194b", penwidth=3]');
    expect(dot).not.toContain('#ff4d4f');
  });

  it('uses resolved circular / type-only circular hex for unhighlighted edges', () => {
    const nodes = [
      fileNode('a.ts'),
      fileNode('b.ts', { position: { x: 100, y: 0 } }),
      fileNode('c.ts', { position: { x: 200, y: 0 } }),
    ];
    const edges = [
      edgeAt('a.ts', 'b.ts', {
        style: { stroke: CIRCULAR_EDGE_COLOR, strokeWidth: 2 },
        data: { title: 'a → b', circular: true, typeOnly: false },
      }),
      edgeAt('b.ts', 'c.ts', {
        style: { stroke: TYPE_ONLY_CIRCULAR_EDGE_COLOR, strokeWidth: 2, strokeDasharray: '6 4' },
        data: { title: 'b → c', circular: true, typeOnly: true },
      }),
    ];

    const dot = serializeGraphToDot({
      nodes,
      edges,
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(dot).toContain('"a.ts" -> "b.ts" [color="#ff4d4f", penwidth=2]');
    expect(dot).toContain('"b.ts" -> "c.ts" [color="#ffa39e", penwidth=2, style=dashed]');
  });

  it('uses resolved error / warn hex for unhighlighted edges', () => {
    const nodes = [
      fileNode('a.ts'),
      fileNode('b.ts', { position: { x: 100, y: 0 } }),
      fileNode('c.ts', { position: { x: 200, y: 0 } }),
    ];
    const edges = [
      edgeAt('a.ts', 'b.ts', {
        style: { stroke: ERROR_EDGE_COLOR, strokeWidth: 2 },
        data: { title: 'a → b', severity: 'error' },
      }),
      edgeAt('b.ts', 'c.ts', {
        style: { stroke: WARNING_EDGE_COLOR, strokeWidth: 2 },
        data: { title: 'b → c', severity: 'warn' },
      }),
    ];

    const dot = serializeGraphToDot({
      nodes,
      edges,
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(dot).toContain('"a.ts" -> "b.ts" [color="#ff4d4f", penwidth=2]');
    expect(dot).toContain('"b.ts" -> "c.ts" [color="#faad14", penwidth=2]');
  });

  it('applies user highlight color and ignores base error stroke when highlighted', () => {
    const nodes = [fileNode('a.ts'), fileNode('b.ts', { position: { x: 200, y: 0 } })];
    const edges = [
      edgeAt('a.ts', 'b.ts', {
        style: { stroke: ERROR_EDGE_COLOR, strokeWidth: 2 },
        data: { title: 'a → b', severity: 'error' },
      }),
    ];
    const depKey = 'a.ts->b.ts';

    const dot = serializeGraphToDot({
      nodes,
      edges,
      userEdgeHighlights: new Map([[depKey, '#e6194b']]),
      edgeDependencyKeyMap: new Map([['a.ts->b.ts', [depKey]]]),
    });

    expect(dot).toContain('"a.ts" -> "b.ts" [color="#e6194b", penwidth=3]');
  });

  it('exports unresolved file nodes with red fill and error border', () => {
    const nodes = [
      fileNode('missing', {
        data: { label: 'missing', path: 'missing', couldNotResolve: true },
      }),
    ];

    const dot = serializeGraphToDot({
      nodes,
      edges: [],
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(dot).toContain('fillcolor="#ff0000"');
    expect(dot).toContain('color="#ff4d4f"');
  });

  it('exports circular file nodes with pink fill and prefers unresolved when both flags set', () => {
    const circularOnly = serializeGraphToDot({
      nodes: [
        fileNode('cycle.ts', {
          data: { label: 'cycle.ts', path: 'cycle.ts', circular: true },
        }),
      ],
      edges: [],
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(circularOnly).toContain('fillcolor="#fff1f0"');
    expect(circularOnly).toContain('color="#ff4d4f"');

    const both = serializeGraphToDot({
      nodes: [
        fileNode('both.ts', {
          data: { label: 'both.ts', path: 'both.ts', circular: true, couldNotResolve: true },
        }),
      ],
      edges: [],
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(both).toContain('fillcolor="#ff0000"');
    expect(both).not.toContain('fillcolor="#fff1f0"');
  });

  it('does not invent active-path colors', () => {
    const nodes = [fileNode('a.ts'), fileNode('b.ts', { position: { x: 100, y: 0 } })];
    const edges = [edgeAt('a.ts', 'b.ts')];

    const dot = serializeGraphToDot({
      nodes,
      edges,
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(dot).toContain('color="#b1b1b7"');
    expect(dot).not.toContain('#1677ff');
    expect(dot).not.toContain('#52c41a');
  });

  it('escapes special characters in path ids and labels', () => {
    const weirdId = 'src/"weird".ts';
    const nodes = [
      fileNode(weirdId, {
        width: 120,
        height: 40,
        data: { label: 'we"ird', path: weirdId },
      }),
    ];

    const dot = serializeGraphToDot({
      nodes,
      edges: [],
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    expect(dot).toContain('"src/\\"weird\\".ts"');
    expect(dot).toContain('label="we\\"ird"');
  });

  it('flips Y so Graphviz origin is bottom-left', () => {
    const nodes = [fileNode('a.ts', { position: { x: 0, y: 0 }, width: 100, height: 50 })];

    const dot = serializeGraphToDot({
      nodes,
      edges: [],
      userEdgeHighlights: new Map(),
      edgeDependencyKeyMap: new Map(),
    });

    // Center at (50, 25) in RF → flipY(25, 50) = 25
    expect(dot).toContain('pos="50,25!"');
    expect(dot).toContain('graph [bb="0,0,100,50", bgcolor="#ffffff"]');
  });
});
