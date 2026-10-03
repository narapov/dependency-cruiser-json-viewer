// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import { type EdgeProps, type Position } from '@xyflow/react';

import { CIRCULAR_EDGE_COLOR } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { useWorkspaceStore } from '../../../../../../stores/workspaceStore';
import { toGraphMarkerId, useGraphMarkersStore } from '../../stores/graphMarkersStore';
import { useSelectedDependencyEdgeStore } from '../../stores/selectedDependencyEdgeStore';
import { DependencyEdge } from './DependencyEdge';

import styles from './DependencyEdge.module.css';

vi.mock('@xyflow/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    useInternalNode: () => undefined,
    BaseEdge: ({
      id,
      style,
      className,
      markerEnd,
    }: {
      id: string;
      style?: { stroke?: string; strokeDasharray?: string };
      className?: string;
      markerEnd?: EdgeProps['markerEnd'];
    }) => (
      <div
        data-testid={`base-edge-${id}`}
        data-stroke={style?.stroke}
        data-stroke-dasharray={style?.strokeDasharray}
        data-class-name={className}
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
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: true, edgesType: 'bezier' });
  });

  afterEach(() => {
    useGraphMarkersStore.getState().clearGraphMarkers();
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: true, edgesType: 'bezier' });
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

  it('animates libavoid fallback edges without avoidPath', () => {
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: true, edgesType: 'libavoidOrthogonal' });

    renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps({ data: { valueCircular: true } })} />
      </svg>,
    );

    const edge = screen.getByTestId('base-edge-a->b');
    expect(edge).toHaveAttribute('data-class-name', styles.pendingRoute);
    expect(edge).toHaveAttribute('data-stroke-dasharray', '8 6');
  });

  it('keeps type-only dash while animating libavoid fallback', () => {
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: true, edgesType: 'libavoidOrthogonal' });

    renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps({ data: { typeOnly: true } })} />
      </svg>,
    );

    const edge = screen.getByTestId('base-edge-a->b');
    expect(edge).toHaveAttribute('data-class-name', styles.pendingRoute);
    expect(edge).toHaveAttribute('data-stroke-dasharray', '6 4');
  });

  it('does not animate when avoidPath is present', () => {
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: true, edgesType: 'libavoidOrthogonal' });

    renderWithTheme(
      <svg>
        <DependencyEdge
          {...edgeProps({
            data: { avoidPath: 'M 0 0 L 10 10' },
          })}
        />
      </svg>,
    );

    const edge = screen.getByTestId('base-edge-a->b');
    expect(edge).not.toHaveAttribute('data-class-name', styles.pendingRoute);
    expect(edge).not.toHaveAttribute('data-stroke-dasharray');
  });

  it('does not animate when edges type is not libavoid', () => {
    useWorkspaceStore.getState().setGraphSettings({ autoLayoutOnly: true, edgesType: 'simpleOrthogonal' });

    renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps({ data: { valueCircular: true } })} />
      </svg>,
    );

    const edge = screen.getByTestId('base-edge-a->b');
    expect(edge).not.toHaveAttribute('data-class-name', styles.pendingRoute);
    expect(edge).not.toHaveAttribute('data-stroke-dasharray');
  });
});
