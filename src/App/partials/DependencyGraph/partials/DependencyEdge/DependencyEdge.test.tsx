// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import { type EdgeProps, type Position } from '@xyflow/react';

import { CIRCULAR_EDGE_COLOR } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { toGraphMarkerId, useGraphMarkersStore } from '../../stores/graphMarkersStore';
import { useSelectedDependencyEdgeStore } from '../../stores/selectedDependencyEdgeStore';
import { DependencyEdge } from './DependencyEdge';

vi.mock('@xyflow/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    BaseEdge: ({
      id,
      style,
      markerEnd,
    }: {
      id: string;
      style?: { stroke?: string };
      markerEnd?: EdgeProps['markerEnd'];
    }) => (
      <div
        data-testid={`base-edge-${id}`}
        data-stroke={style?.stroke}
        data-marker-end={typeof markerEnd === 'string' ? markerEnd : undefined}
      />
    ),
  };
});

function edgeProps(overrides: Partial<EdgeProps> = {}): EdgeProps {
  return {
    id: 'a->b',
    source: 'a',
    target: 'b',
    sourceX: 0,
    sourceY: 0,
    targetX: 10,
    targetY: 10,
    sourcePosition: 'right' as Position,
    targetPosition: 'left' as Position,
    markerStart: undefined,
    markerEnd: undefined,
    data: { valueCircular: true },
    ...overrides,
  } as EdgeProps;
}

describe('DependencyEdge', () => {
  beforeEach(() => {
    useSelectedDependencyEdgeStore.getState().setSelectedEdgeId(null);
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  afterEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
  });

  it('renders base edge and computed title from flags', () => {
    const { container } = renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps()} />
      </svg>,
    );

    expect(screen.getByTestId('base-edge-a->b')).toBeInTheDocument();
    expect(container.querySelector('title')?.textContent).toContain('a → b');
    expect(container.querySelector('title')?.textContent).toContain('(circular)');
  });

  it('uses a shared marker url for the edge stroke without a local marker', () => {
    const { container } = renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps()} />
      </svg>,
    );

    expect(screen.getByTestId('base-edge-a->b')).toHaveAttribute(
      'data-marker-end',
      `url('#${toGraphMarkerId(CIRCULAR_EDGE_COLOR)}')`,
    );
    expect(screen.getByTestId('base-edge-a->b')).toHaveAttribute('data-stroke', CIRCULAR_EDGE_COLOR);
    expect(container.querySelector('marker')).toBeNull();
  });

  it('still renders when data is missing', () => {
    const { container } = renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps({ data: undefined })} />
      </svg>,
    );

    expect(screen.getByTestId('base-edge-a->b')).toBeInTheDocument();
    expect(container.querySelector('title')?.textContent).toBe('a → b');
  });
});
