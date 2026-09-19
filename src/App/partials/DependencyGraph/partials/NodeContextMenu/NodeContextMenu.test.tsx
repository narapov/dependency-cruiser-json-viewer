// @vitest-environment jsdom

import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { GraphActionsProvider } from '../../contexts';
import { createMockGraphActions } from '../../contexts/GraphActionsContext/__fixtures__/mockGraphActions';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeContextMenuTrigger } from './partials';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

function renderNodeContextMenu(
  props: Omit<ComponentProps<typeof NodeContextMenu>, 'children'>,
  actions = createMockGraphActions(),
  { withMenuButton = false }: { withMenuButton?: boolean } = {},
) {
  renderWithTheme(
    <GraphActionsProvider value={actions}>
      <NodeContextMenu {...props}>
        <span>{props.path}</span>
        {withMenuButton ? <NodeContextMenuTrigger /> : null}
      </NodeContextMenu>
    </GraphActionsProvider>,
  );
  return actions;
}

describe('NodeContextMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens menu and shows folder-only actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderNodeContextMenu({
      path: 'src/b',
      isFolder: true,
      expanded: true,
    });

    fireEvent.contextMenu(screen.getByText('src/b'));

    expect(screen.getByText(i18n.current.t('actions.copyPath'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.collapse'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.expandRecursive'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showInFileTree'))).toBeInTheDocument();
  });

  it('opens menu from the menu button', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderNodeContextMenu(
      {
        path: 'src/a.ts',
        isFolder: false,
      },
      createMockGraphActions(),
      { withMenuButton: true },
    );

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.openNodeMenu') }));

    expect(screen.getByText(i18n.current.t('actions.copyPath'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showInFileTree'))).toBeInTheDocument();
  });

  it('runs action from button-opened menu and closes', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { copyToClipboard } = await import('@/Shared');

    renderNodeContextMenu(
      {
        path: 'src/a.ts',
        isFolder: false,
      },
      createMockGraphActions(),
      { withMenuButton: true },
    );

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.openNodeMenu') }));
    fireEvent.click(screen.getByText(i18n.current.t('actions.copyPath')));

    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('runs action and closes menu', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { copyToClipboard } = await import('@/Shared');

    renderNodeContextMenu({
      path: 'src/a.ts',
      isFolder: false,
    });

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.copyPath')));

    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('hides folder actions for files', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderNodeContextMenu({
      path: 'src/a.ts',
      isFolder: false,
    });

    fireEvent.contextMenu(screen.getByText('src/a.ts'));

    expect(screen.queryByText(i18n.current.t('actions.expand'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.current.t('actions.expandRecursive'))).not.toBeInTheDocument();
  });

  it('shows hide and show-relation actions and runs them', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onHideOthers = vi.fn();
    const onShowDirectDependencies = vi.fn();
    const onShowDirectDependents = vi.fn();
    const actions = renderNodeContextMenu(
      {
        path: 'src/a.ts',
        isFolder: false,
      },
      createMockGraphActions({
        onHideOthers,
        onShowDirectDependencies,
        onShowDirectDependents,
      }),
    );

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    expect(screen.getByText(i18n.current.t('actions.hideOthers'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showDirectDependencies'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showDirectDependents'))).toBeInTheDocument();

    fireEvent.click(screen.getByText(i18n.current.t('actions.hideOthers')));
    expect(onHideOthers).toHaveBeenCalledWith('src/a.ts');
    expect(actions.onHideOthers).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.showDirectDependencies')));
    expect(onShowDirectDependencies).toHaveBeenCalledWith('src/a.ts');

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.showDirectDependents')));
    expect(onShowDirectDependents).toHaveBeenCalledWith('src/a.ts');
  });

  it('shows view module JSON and runs it', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onViewModuleJson = vi.fn();
    renderNodeContextMenu(
      {
        path: 'src/a.ts',
        isFolder: false,
      },
      createMockGraphActions({ onViewModuleJson }),
    );

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('moduleJson.view')));

    expect(onViewModuleJson).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not propagate backdrop dismiss click to parent', () => {
    const onParentClick = vi.fn();

    renderWithTheme(
      <GraphActionsProvider value={createMockGraphActions()}>
        <div onClick={onParentClick}>
          <NodeContextMenu path="src/a.ts" isFolder={false}>
            <span>src/a.ts</span>
          </NodeContextMenu>
        </div>
      </GraphActionsProvider>,
    );

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();
    fireEvent.mouseDown(backdrop!);
    fireEvent.click(backdrop!);

    expect(onParentClick).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
