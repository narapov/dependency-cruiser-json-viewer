// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, screen } from '@testing-library/react';

import { buildCruiseTreeSnapshot } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, pathsToPresenceRecord, useWorkspaceStore } from '../../../../stores/workspaceStore';
import { useFileTreeContextMenu } from './useFileTreeContextMenu';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

const CRUISE_TREE = buildCruiseTreeSnapshot([
  { source: 'src/a.ts', dependencies: [], dependents: [], valid: true },
  { source: 'src/b/c.ts', dependencies: [], dependents: [], valid: true },
]);

beforeEach(() => {
  useWorkspaceStore.setState({
    ...initialWorkspaceState,
    cruiseTree: CRUISE_TREE,
    selectedFilePaths: pathsToPresenceRecord(['src/a.ts', 'src/b/c.ts']),
    expandedFolderPaths: pathsToPresenceRecord(['src', 'src/b']),
  });
});

interface MenuProps {
  open: boolean;
  anchorPosition?: { top: number; left: number };
  onClose: () => void;
}

function menuElement(node: ReturnType<typeof useFileTreeContextMenu>['contextMenu']): ReactElement<MenuProps> {
  return node as ReactElement<MenuProps>;
}

describe('useFileTreeContextMenu', () => {
  it('opens menu from openContextMenu with path', () => {
    const { result } = renderHook(() =>
      useFileTreeContextMenu({
        onShowInGraph: vi.fn(),
        onViewModuleJson: vi.fn(),
      }),
    );

    expect(menuElement(result.current.contextMenu).props.open).toBe(false);

    const preventDefault = vi.fn();
    act(() => {
      result.current.openContextMenu(
        {
          preventDefault,
          clientX: 40,
          clientY: 50,
        } as never,
        'src/a.ts',
      );
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(menuElement(result.current.contextMenu).props.open).toBe(true);
    expect(menuElement(result.current.contextMenu).props.anchorPosition).toEqual({ top: 50, left: 40 });
  });

  it('closes menu via onClose', () => {
    const { result } = renderHook(() =>
      useFileTreeContextMenu({
        onShowInGraph: vi.fn(),
        onViewModuleJson: vi.fn(),
      }),
    );

    act(() => {
      result.current.openContextMenu(
        {
          preventDefault: vi.fn(),
          clientX: 1,
          clientY: 2,
        } as never,
        'src/a.ts',
      );
    });
    expect(menuElement(result.current.contextMenu).props.open).toBe(true);

    act(() => {
      menuElement(result.current.contextMenu).props.onClose();
    });
    expect(menuElement(result.current.contextMenu).props.open).toBe(false);
  });

  it('always includes view module JSON menu item', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { result } = renderHook(() =>
      useFileTreeContextMenu({
        onShowInGraph: vi.fn(),
        onViewModuleJson: vi.fn(),
      }),
    );

    act(() => {
      result.current.openContextMenu(
        {
          preventDefault: vi.fn(),
          clientX: 1,
          clientY: 2,
        } as never,
        'src/a.ts',
      );
    });

    renderWithTheme(result.current.contextMenu);
    expect(screen.getByText(i18n.current.t('moduleJson.view'))).toBeInTheDocument();
  });
});
