// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import { GraphActionsProvider } from '../../contexts';
import { createMockGraphActions } from '../../contexts/GraphActionsContext/mockGraphActions';
import type { FolderGroupNodeData } from '../../types';
import { FolderGroupNode } from './FolderGroupNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function groupNodeProps(data: FolderGroupNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

function renderFolderGroupNode(data: FolderGroupNodeData, actions = createMockGraphActions()) {
  renderWithTheme(
    <GraphActionsProvider value={actions}>
      <FolderGroupNode {...groupNodeProps(data)} />
    </GraphActionsProvider>,
  );
  return actions;
}

describe('FolderGroupNode', () => {
  it('renders group header and toggles expand', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onToggleFolder = vi.fn();
    const actions = renderFolderGroupNode(
      {
        label: 'src',
        path: 'src',
        expanded: true,
        highlighted: true,
        backgroundColor: '#f5f5f5',
      },
      createMockGraphActions({ onToggleFolder }),
    );

    expect(screen.getByText('src')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.collapseFolder') }));
    expect(actions.onToggleFolder).toHaveBeenCalledWith('src');
    expect(onToggleFolder).toHaveBeenCalledWith('src');
  });

  it('opens context menu with folder actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderFolderGroupNode({
      label: 'lib',
      path: 'lib',
      expanded: false,
      backgroundColor: '#fff',
    });

    fireEvent.contextMenu(screen.getByText('lib'));
    expect(screen.getByText(i18n.current.t('actions.expand'))).toBeInTheDocument();
  });

  it('opens context menu with auto layout actions when provided', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onAutoLayoutGroup = vi.fn();
    const onAutoLayoutGroupRecursive = vi.fn();

    renderFolderGroupNode(
      {
        label: 'lib',
        path: 'lib',
        expanded: false,
        backgroundColor: '#fff',
      },
      createMockGraphActions({ onAutoLayoutGroup, onAutoLayoutGroupRecursive }),
    );

    fireEvent.contextMenu(screen.getByText('lib'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.autoLayout')));
    fireEvent.contextMenu(screen.getByText('lib'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.autoLayoutRecursive')));

    expect(onAutoLayoutGroup).toHaveBeenCalledWith('lib');
    expect(onAutoLayoutGroupRecursive).toHaveBeenCalledWith('lib');
  });
});
