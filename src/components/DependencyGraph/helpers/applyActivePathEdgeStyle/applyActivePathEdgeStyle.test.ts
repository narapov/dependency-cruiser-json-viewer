import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { MarkerType, type Edge } from '@xyflow/react';

import { CIRCULAR_EDGE_COLOR, DEFAULT_EDGE_COLOR, INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR } from '@/Shared';

import { buildGraph } from '../buildGraph/buildGraph';
import { applyActivePathEdgeStyle } from './applyActivePathEdgeStyle';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

const noopToggle = () => {};
const noopShowInFileTree = () => {};
const noopExpandRecursive = () => {};

function edgeAt(id: string, source: string, target: string, stroke = DEFAULT_EDGE_COLOR): Edge {
  return {
    id,
    source,
    target,
    markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
    style: { stroke, strokeWidth: 1 },
  };
}

describe('applyActivePathEdgeStyle', () => {
  it('returns edges unchanged when activePath is null', () => {
    const edges = [edgeAt('edge-1', 'a', 'b')];
    expect(applyActivePathEdgeStyle(edges, null)).toBe(edges);
  });

  it('colors incoming edges to activePath', () => {
    const edges = [edgeAt('edge-1', 'a', 'active'), edgeAt('edge-2', 'b', 'c')];
    const result = applyActivePathEdgeStyle(edges, 'active');
    const incoming = result.find(edge => edge.id === 'edge-1');
    const other = result.find(edge => edge.id === 'edge-2');

    expect(incoming?.style?.stroke).toBe(INCOMING_EDGE_COLOR);
    expect(incoming?.style?.strokeWidth).toBe(2);
    expect(incoming?.markerEnd).toMatchObject({ color: INCOMING_EDGE_COLOR });
    expect(other).toBe(edges[1]);
  });

  it('colors outgoing edges from activePath', () => {
    const edges = [edgeAt('edge-1', 'active', 'b')];
    const result = applyActivePathEdgeStyle(edges, 'active');
    const outgoing = result.find(edge => edge.id === 'edge-1');

    expect(outgoing?.style?.stroke).toBe(OUTGOING_EDGE_COLOR);
    expect(outgoing?.style?.strokeWidth).toBe(2);
    expect(outgoing?.markerEnd).toMatchObject({ color: OUTGOING_EDGE_COLOR });
  });

  it('keeps circular edge red when node is highlighted', () => {
    const circularDep = {
      resolved: 'src/foo/b.ts',
      circular: true,
    } as IModule['dependencies'][0];

    const modules = [moduleAt('src/foo/a.ts', [circularDep]), moduleAt('src/foo/b.ts')];
    const { edges } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'src/foo/b.ts'],
      expandedFolders: new Set(['src', 'src/foo']),
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    });

    const result = applyActivePathEdgeStyle(edges, 'src/foo/a.ts');
    const circularEdge = result.find(edge => edge.source === 'src/foo/a.ts');

    expect(circularEdge?.style?.stroke).toBe(CIRCULAR_EDGE_COLOR);
  });
});
