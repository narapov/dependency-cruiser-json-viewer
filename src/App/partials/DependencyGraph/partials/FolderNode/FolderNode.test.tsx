// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import type { FolderNodeData } from '../../types';
import { FolderNode } from './FolderNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

function folderNodeProps(data: FolderNodeData): NodeProps {
  return { data } as NodeProps;
}

describe('FolderNode', () => {
  afterEach(() => {
    cleanup();
  });

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
