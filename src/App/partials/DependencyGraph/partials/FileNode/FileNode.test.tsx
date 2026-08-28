// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import { GraphActionsProvider } from '../../contexts';
import { createMockGraphActions } from '../../contexts/GraphActionsContext/mockGraphActions';
import type { FileNodeData } from '../../types';
import { FileNode } from './FileNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function fileNodeProps(data: FileNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

function renderFileNode(data: FileNodeData, actions = createMockGraphActions()) {
  renderWithTheme(
    <GraphActionsProvider value={actions}>
      <FileNode {...fileNodeProps(data)} />
    </GraphActionsProvider>,
  );
  return actions;
}

describe('FileNode', () => {
  it('renders label and opens context menu', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderFileNode({
      label: 'a.ts',
      path: 'src/a.ts',
    });

    expect(screen.getByText('a.ts')).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('a.ts'));
    expect(screen.getByText(i18n.current.t('actions.copyPath'))).toBeInTheDocument();
  });

  it('applies circular styling', () => {
    renderFileNode({
      label: 'cycle.ts',
      path: 'src/cycle.ts',
      circular: true,
    });

    expect(screen.getByText('cycle.ts')).toBeInTheDocument();
  });

  it('applies unresolved error styling', () => {
    renderFileNode({
      label: 'missing',
      path: './missing',
      couldNotResolve: true,
    });

    expect(screen.getByText('missing')).toBeInTheDocument();
  });

  it('prefers unresolved styling over circular when both flags are set', () => {
    renderFileNode({
      label: 'both.ts',
      path: 'src/both.ts',
      circular: true,
      couldNotResolve: true,
    });

    expect(screen.getByText('both.ts')).toBeInTheDocument();
  });
});
