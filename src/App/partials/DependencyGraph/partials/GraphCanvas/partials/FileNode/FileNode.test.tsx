// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import type { FileNodeData } from '../../types';
import { NodeContextMenuControlsProvider } from '../NodeContextMenu';
import { FileNode } from './FileNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function fileNodeProps(data: FileNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

function renderFileNode(data: FileNodeData, openContextMenu = vi.fn(), openAtElement = vi.fn()) {
  renderWithTheme(
    <NodeContextMenuControlsProvider value={{ openContextMenu, openAtElement }}>
      <FileNode {...fileNodeProps(data)} />
    </NodeContextMenuControlsProvider>,
  );
  return { openContextMenu, openAtElement };
}

describe('FileNode', () => {
  it('renders label and opens context menu', () => {
    const { openContextMenu } = renderFileNode({
      label: 'a.ts',
      path: 'src/a.ts',
    });

    expect(screen.getByText('a.ts')).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('a.ts'));
    expect(openContextMenu).toHaveBeenCalledWith(expect.any(Object), 'src/a.ts');
  });

  it('opens menu from the trigger button', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { openAtElement } = renderFileNode({
      label: 'a.ts',
      path: 'src/a.ts',
    });

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.openNodeMenu') }));
    expect(openAtElement).toHaveBeenCalledWith(expect.any(HTMLElement), 'src/a.ts');
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
