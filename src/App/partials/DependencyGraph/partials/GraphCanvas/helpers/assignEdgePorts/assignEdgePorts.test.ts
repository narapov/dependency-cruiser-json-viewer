import { describe, expect, it } from 'vitest';

import { assignEdgePorts, edgePortY } from './assignEdgePorts';

describe('edgePortY', () => {
  it('places a single port at mid-height', () => {
    expect(edgePortY(0, 1, 40)).toBe(20);
  });

  it('spreads three ports evenly', () => {
    expect(edgePortY(0, 3, 40)).toBe(10);
    expect(edgePortY(1, 3, 40)).toBe(20);
    expect(edgePortY(2, 3, 40)).toBe(30);
  });
});

describe('assignEdgePorts', () => {
  it('assigns distinct EAST slots top-to-bottom by target center Y', () => {
    const nodes = [
      { id: 'src', position: { x: 0, y: 0 }, width: 100, height: 40 },
      { id: 'top', position: { x: 200, y: 0 }, width: 100, height: 40 },
      { id: 'mid', position: { x: 200, y: 100 }, width: 100, height: 40 },
      { id: 'bot', position: { x: 200, y: 200 }, width: 100, height: 40 },
    ];
    const edges = [
      { id: 'to-bot', source: 'src', target: 'bot' },
      { id: 'to-top', source: 'src', target: 'top' },
      { id: 'to-mid', source: 'src', target: 'mid' },
    ];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['top', null],
      ['mid', null],
      ['bot', null],
    ]);

    const ports = assignEdgePorts({ nodes, edges, parentByNode });

    expect(ports.get('to-top')?.source).toEqual({ side: 'east', index: 0, y: 10 });
    expect(ports.get('to-mid')?.source).toEqual({ side: 'east', index: 1, y: 20 });
    expect(ports.get('to-bot')?.source).toEqual({ side: 'east', index: 2, y: 30 });
  });

  it('assigns distinct WEST slots top-to-bottom by source center Y', () => {
    const nodes = [
      { id: 'tgt', position: { x: 200, y: 0 }, width: 100, height: 40 },
      { id: 'top', position: { x: 0, y: 0 }, width: 100, height: 40 },
      { id: 'mid', position: { x: 0, y: 100 }, width: 100, height: 40 },
      { id: 'bot', position: { x: 0, y: 200 }, width: 100, height: 40 },
    ];
    const edges = [
      { id: 'from-bot', source: 'bot', target: 'tgt' },
      { id: 'from-top', source: 'top', target: 'tgt' },
      { id: 'from-mid', source: 'mid', target: 'tgt' },
    ];
    const parentByNode = new Map<string, string | null>([
      ['tgt', null],
      ['top', null],
      ['mid', null],
      ['bot', null],
    ]);

    const ports = assignEdgePorts({ nodes, edges, parentByNode });

    expect(ports.get('from-top')?.target).toEqual({ side: 'west', index: 0, y: 10 });
    expect(ports.get('from-mid')?.target).toEqual({ side: 'west', index: 1, y: 20 });
    expect(ports.get('from-bot')?.target).toEqual({ side: 'west', index: 2, y: 30 });
  });

  it('uses absolute centers through nested parents', () => {
    const nodes = [
      { id: 'group', position: { x: 0, y: 100 }, width: 400, height: 200 },
      { id: 'a', position: { x: 10, y: 20 }, width: 100, height: 40 },
      { id: 'b', position: { x: 200, y: 80 }, width: 100, height: 40 },
    ];
    const edges = [{ id: 'a->b', source: 'a', target: 'b' }];
    const parentByNode = new Map<string, string | null>([
      ['group', null],
      ['a', 'group'],
      ['b', 'group'],
    ]);

    const ports = assignEdgePorts({ nodes, edges, parentByNode });

    expect(ports.get('a->b')).toEqual({
      source: { side: 'east', index: 0, y: 20 },
      target: { side: 'west', index: 0, y: 20 },
    });
  });
});
