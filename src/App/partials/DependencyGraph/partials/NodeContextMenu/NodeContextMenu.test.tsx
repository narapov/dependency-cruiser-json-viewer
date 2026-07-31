// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { NodeContextMenu } from './NodeContextMenu';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

describe('NodeContextMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens menu and shows folder-only actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onToggle = vi.fn();
    const onExpandRecursive = vi.fn();
    const onShowInFileTree = vi.fn();

    renderWithTheme(
      <NodeContextMenu
        path="src/b"
        isFolder
        expanded
        onToggle={onToggle}
        onExpandRecursive={onExpandRecursive}
        onShowInFileTree={onShowInFileTree}
      >
        <span>target</span>
      </NodeContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText('target'));

    expect(screen.getByText(i18n.current.t('actions.copyPath'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.collapse'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.expandRecursive'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showInFileTree'))).toBeInTheDocument();
  });

  it('runs action and closes menu', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowInFileTree = vi.fn();
    const { copyToClipboard } = await import('@/Shared');

    renderWithTheme(
      <NodeContextMenu path="src/a.ts" isFolder={false} onShowInFileTree={onShowInFileTree}>
        <span>file</span>
      </NodeContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText('file'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.copyPath')));

    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('hides folder actions for files', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <NodeContextMenu path="src/a.ts" isFolder={false} onShowInFileTree={vi.fn()}>
        <span>file</span>
      </NodeContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText('file'));

    expect(screen.queryByText(i18n.current.t('actions.expand'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.current.t('actions.expandRecursive'))).not.toBeInTheDocument();
  });
});
