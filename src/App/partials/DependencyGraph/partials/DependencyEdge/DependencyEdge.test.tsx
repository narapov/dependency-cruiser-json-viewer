// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import type { EdgeProps, Position } from '@xyflow/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { DependencyEdge } from './DependencyEdge';

vi.mock('@xyflow/react', () => ({
  BaseEdge: ({ id }: { id: string }) => <div data-testid={`base-edge-${id}`} />,
  getBezierPath: () => ['M0 0 L10 10', 0, 0],
}));
function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

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
    data: { title: 'a → b' },
    ...overrides,
  } as EdgeProps;
}

describe('DependencyEdge', () => {
  it('renders base edge and title when provided', () => {
    const { container } = renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps()} />
      </svg>,
    );

    expect(screen.getByTestId('base-edge-a->b')).toBeInTheDocument();
    expect(container.querySelector('title')?.textContent).toBe('a → b');
  });

  it('omits title when data has none', () => {
    const { container } = renderWithTheme(
      <svg>
        <DependencyEdge {...edgeProps({ data: undefined })} />
      </svg>,
    );

    expect(screen.getByTestId('base-edge-a->b')).toBeInTheDocument();
    expect(container.querySelector('title')).not.toBeInTheDocument();
  });
});
