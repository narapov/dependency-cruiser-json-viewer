// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../../../stores/workspaceStore';
import type { FolderNodeData } from '../../types';
import { NodeContextMenuControlsProvider } from '../NodeContextMenu';
import { FolderNode } from './FolderNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function folderNodeProps(data: FolderNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

function renderFolderNode(data: FolderNodeData, openContextMenu = vi.fn(), openAtElement = vi.fn()) {
  renderWithTheme(
    <NodeContextMenuControlsProvider value={{ openContextMenu, openAtElement }}>
      <FolderNode {...folderNodeProps(data)} />
    </NodeContextMenuControlsProvider>,
  );
  return { openContextMenu, openAtElement };
}

describe('FolderNode', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      ...initialWorkspaceState,
      expandedFolderPaths: {},
    });
  });

  it('renders label and toggles expand via button', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    renderFolderNode({
      label: 'foo',
      path: 'src/foo',
      expanded: false,
      backgroundColor: '#eee',
    });

    expect(screen.getByText('foo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expandFolder') }));
    expect(useWorkspaceStore.getState().expandedFolderPaths['src/foo']).toBe(true);
  });

  it('opens context menu for folder path', () => {
    const { openContextMenu } = renderFolderNode({
      label: 'bar',
      path: 'src/bar',
      expanded: true,
      circular: true,
      backgroundColor: '#ddd',
    });

    fireEvent.contextMenu(screen.getByText('bar'));
    expect(openContextMenu).toHaveBeenCalledWith(expect.any(Object), 'src/bar');
  });
});
