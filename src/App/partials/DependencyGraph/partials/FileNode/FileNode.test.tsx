// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import type { FileNodeData } from '../../types';
import { FileNode } from './FileNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function fileNodeProps(data: FileNodeData): NodeProps {
  return { id: data.path, data } as unknown as NodeProps;
}

describe('FileNode', () => {
  it('renders label and opens context menu', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowInFileTree = vi.fn();

    renderWithTheme(
      <FileNode
        {...fileNodeProps({
          label: 'a.ts',
          path: 'src/a.ts',
          onShowInFileTree,
        })}
      />,
    );

    expect(screen.getByText('a.ts')).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('a.ts'));
    expect(screen.getByText(i18n.current.t('actions.copyPath'))).toBeInTheDocument();
  });

  it('applies circular styling', () => {
    renderWithTheme(
      <FileNode
        {...fileNodeProps({
          label: 'cycle.ts',
          path: 'src/cycle.ts',
          circular: true,
          onShowInFileTree: vi.fn(),
        })}
      />,
    );

    expect(screen.getByText('cycle.ts')).toBeInTheDocument();
  });

  it('applies unresolved error styling', () => {
    renderWithTheme(
      <FileNode
        {...fileNodeProps({
          label: 'missing',
          path: './missing',
          couldNotResolve: true,
          onShowInFileTree: vi.fn(),
        })}
      />,
    );

    expect(screen.getByText('missing')).toBeInTheDocument();
  });

  it('prefers unresolved styling over circular when both flags are set', () => {
    renderWithTheme(
      <FileNode
        {...fileNodeProps({
          label: 'both.ts',
          path: 'src/both.ts',
          circular: true,
          couldNotResolve: true,
          onShowInFileTree: vi.fn(),
        })}
      />,
    );

    expect(screen.getByText('both.ts')).toBeInTheDocument();
  });
});
