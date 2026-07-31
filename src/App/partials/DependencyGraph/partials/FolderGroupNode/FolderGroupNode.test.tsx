// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import type { FolderGroupNodeData } from '../../types';
import { FolderGroupNode } from './FolderGroupNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function groupNodeProps(data: FolderGroupNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

describe('FolderGroupNode', () => {
  it('renders group header and toggles expand', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onToggle = vi.fn();

    renderWithTheme(
      <FolderGroupNode
        {...groupNodeProps({
          label: 'src',
          path: 'src',
          expanded: true,
          highlighted: true,
          backgroundColor: '#f5f5f5',
          onToggle,
          onExpandRecursive: vi.fn(),
          onShowInFileTree: vi.fn(),
        })}
      />,
    );

    expect(screen.getByText('src')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.collapseFolder') }));
    expect(onToggle).toHaveBeenCalledWith('src');
  });

  it('opens context menu with folder actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <FolderGroupNode
        {...groupNodeProps({
          label: 'lib',
          path: 'lib',
          expanded: false,
          backgroundColor: '#fff',
          onToggle: vi.fn(),
          onExpandRecursive: vi.fn(),
          onShowInFileTree: vi.fn(),
        })}
      />,
    );

    fireEvent.contextMenu(screen.getByText('lib'));
    expect(screen.getByText(i18n.current.t('actions.expand'))).toBeInTheDocument();
  });
});
