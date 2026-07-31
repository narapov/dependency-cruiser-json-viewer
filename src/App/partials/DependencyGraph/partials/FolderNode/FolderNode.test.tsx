// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import type { FolderNodeData } from '../../types';
import { FolderNode } from './FolderNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function folderNodeProps(data: FolderNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

describe('FolderNode', () => {
  it('renders label and toggles expand via button', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onToggle = vi.fn();

    renderWithTheme(
      <FolderNode
        {...folderNodeProps({
          label: 'foo',
          path: 'src/foo',
          expanded: false,
          backgroundColor: '#eee',
          onToggle,
          onExpandRecursive: vi.fn(),
          onShowInFileTree: vi.fn(),
        })}
      />,
    );

    expect(screen.getByText('foo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expandFolder') }));
    expect(onToggle).toHaveBeenCalledWith('src/foo');
  });

  it('opens context menu for folder actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <FolderNode
        {...folderNodeProps({
          label: 'bar',
          path: 'src/bar',
          expanded: true,
          circular: true,
          highlighted: true,
          backgroundColor: '#ddd',
          onToggle: vi.fn(),
          onExpandRecursive: vi.fn(),
          onShowInFileTree: vi.fn(),
        })}
      />,
    );

    fireEvent.contextMenu(screen.getByText('bar'));
    expect(screen.getByText(i18n.current.t('actions.collapse'))).toBeInTheDocument();
  });
});
