import { describe, expect, it } from 'vitest';

import type { Edge, Node } from '@xyflow/react';

import { assignEdgeHandles } from './assignEdgeHandles';

function node(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: { label: id, path: id, incomingHandleCount: 0, outgoingHandleCount: 0 },
    height: 40,
    ...overrides,
  };
}

function edge(source: string, target: string): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
  };
}

describe('assignEdgeHandles', () => {
  it('assigns out-i / in-j handles and stamps counts on connected nodes', () => {
    const nodes = [node('a'), node('b', { position: { x: 100, y: 0 } })];
    const edges = [edge('a', 'b')];

    const result = assignEdgeHandles(nodes, edges);

    expect(result.edges[0]).toMatchObject({
      id: 'a->b',
      sourceHandle: 'out-0',
      targetHandle: 'in-0',
    });
    expect(result.nodes.find(n => n.id === 'a')?.data).toMatchObject({
      outgoingHandleCount: 1,
      incomingHandleCount: 0,
    });
    expect(result.nodes.find(n => n.id === 'b')?.data).toMatchObject({
      incomingHandleCount: 1,
      outgoingHandleCount: 0,
    });
  });

  it('sorts outgoing handles by target absolute Y', () => {
    const nodes = [
      node('source'),
      node('low', { position: { x: 100, y: 10 } }),
      node('high', { position: { x: 100, y: 200 } }),
    ];
    const edges = [edge('source', 'high'), edge('source', 'low')];

    const result = assignEdgeHandles(nodes, edges);

    expect(result.edges.find(e => e.id === 'source->low')?.sourceHandle).toBe('out-0');
    expect(result.edges.find(e => e.id === 'source->high')?.sourceHandle).toBe('out-1');
    expect(result.nodes.find(n => n.id === 'source')?.data.outgoingHandleCount).toBe(2);
  });

  it('sorts incoming handles by source absolute Y', () => {
    const nodes = [
      node('target', { position: { x: 200, y: 100 } }),
      node('low', { position: { x: 0, y: 10 } }),
      node('high', { position: { x: 0, y: 200 } }),
    ];
    const edges = [edge('high', 'target'), edge('low', 'target')];

    const result = assignEdgeHandles(nodes, edges);

    expect(result.edges.find(e => e.id === 'low->target')?.targetHandle).toBe('in-0');
    expect(result.edges.find(e => e.id === 'high->target')?.targetHandle).toBe('in-1');
    expect(result.nodes.find(n => n.id === 'target')?.data.incomingHandleCount).toBe(2);
  });

  it('uses parent offsets for absolute Y when sorting', () => {
    const nodes = [
      node('group', { position: { x: 0, y: 100 }, height: 200 }),
      node('source', { position: { x: 0, y: 0 }, parentId: 'group' }),
      node('nested-low', { position: { x: 100, y: 10 }, parentId: 'group' }),
      node('nested-high', { position: { x: 100, y: 80 }, parentId: 'group' }),
    ];
    const edges = [edge('source', 'nested-high'), edge('source', 'nested-low')];

    const result = assignEdgeHandles(nodes, edges);

    expect(result.edges.find(e => e.id === 'source->nested-low')?.sourceHandle).toBe('out-0');
    expect(result.edges.find(e => e.id === 'source->nested-high')?.sourceHandle).toBe('out-1');
  });

  it('keeps isolated node identity without rewriting data', () => {
    const alone = node('alone');
    const result = assignEdgeHandles([alone], []);

    expect(result.nodes[0]).toBe(alone);
    expect(result.nodes[0]?.data).toMatchObject({
      incomingHandleCount: 0,
      outgoingHandleCount: 0,
    });
  });

  it('uses distinct out/in slots for self-loops', () => {
    const nodes = [node('loop')];
    const edges = [edge('loop', 'loop')];

    const result = assignEdgeHandles(nodes, edges);

    expect(result.edges[0]).toMatchObject({
      sourceHandle: 'out-0',
      targetHandle: 'in-0',
    });
    expect(result.nodes[0]?.data).toMatchObject({
      outgoingHandleCount: 1,
      incomingHandleCount: 1,
    });
  });
});
