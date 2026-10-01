// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../../../../../stores/workspaceStore';
import type { FolderGroupNodeData } from '../../types';
import { NodeContextMenuControlsProvider } from '../NodeContextMenu';
import { FolderGroupNode } from './FolderGroupNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function groupNodeProps(data: FolderGroupNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

function renderFolderGroupNode(data: FolderGroupNodeData, openContextMenu = vi.fn(), openAtElement = vi.fn()) {
  renderWithTheme(
    <NodeContextMenuControlsProvider value={{ openContextMenu, openAtElement }}>
      <FolderGroupNode {...groupNodeProps(data)} />
    </NodeContextMenuControlsProvider>,
  );
  return { openContextMenu, openAtElement };
}

describe('FolderGroupNode', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      ...initialWorkspaceState,
      expandedFolderPaths: { src: true },
    });
  });

  it('renders group header and toggles expand', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    renderFolderGroupNode({
      label: 'src',
      path: 'src',
      expanded: true,
      backgroundColor: '#f5f5f5',
    });

    expect(screen.getByText('src')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.collapseFolder') }));
    expect(useWorkspaceStore.getState().expandedFolderPaths.src).toBeUndefined();
  });

  it('opens context menu for folder path', () => {
    const { openContextMenu } = renderFolderGroupNode({
      label: 'lib',
      path: 'lib',
      expanded: false,
      backgroundColor: '#fff',
    });

    fireEvent.contextMenu(screen.getByText('lib'));
    expect(openContextMenu).toHaveBeenCalledWith(expect.any(Object), 'lib');
  });
});
