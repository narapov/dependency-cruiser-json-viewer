// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import {
  initialWorkspaceState,
  pathsToPresenceRecord,
  useWorkspaceStore,
} from '../../../../../../stores/workspaceStore';
import { NodeContextMenuControlsProvider } from './contexts';
import { useNodeContextMenu } from './hooks';
import { NodeContextMenuTrigger } from './partials';

const workspaceActions = vi.hoisted(() => ({
  toggleFolder: vi.fn(),
  expandRecursive: vi.fn(),
  collapseRecursive: vi.fn(),
  expandToLevel: vi.fn(),
  collapseToLevel: vi.fn(),
  activatePath: vi.fn(),
  showDependenciesPanel: vi.fn(),
  showApplicableRulesPanel: vi.fn(),
  hideOthers: vi.fn(),
  showDirectDependencies: vi.fn(),
  showDirectDependents: vi.fn(),
}));

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('../../hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('../../hooks')>();
  return {
    ...actual,
    useGraphWorkspaceActions: () => workspaceActions,
  };
});

const CRUISE_TREE = buildCruiseSnapshot([
  { source: 'src/a.ts', dependencies: [], dependents: [], valid: true },
  { source: 'src/b/c.ts', dependencies: [], dependents: [], valid: true },
]);

interface HarnessOptions {
  path: string;
  withMenuButton?: boolean;
  onShowInFileTree?: (path: string) => void;
  onViewModuleJson?: (path: string) => void;
  onAutoLayoutGroup?: (groupId: string) => void;
  onAutoLayoutGroupRecursive?: (groupId: string) => void;
}

function TestHarness(props: HarnessOptions) {
  const {
    path,
    withMenuButton = false,
    onShowInFileTree = vi.fn(),
    onViewModuleJson = vi.fn(),
    onAutoLayoutGroup,
    onAutoLayoutGroupRecursive,
  } = props;

  const { openContextMenu, openAtElement, contextMenu } = useNodeContextMenu({
    onShowInFileTree,
    onViewModuleJson,
    promptFolderLevel: vi.fn(() => Promise.resolve(null)),
    onAutoLayoutGroup,
    onAutoLayoutGroupRecursive,
  });

  return (
    <NodeContextMenuControlsProvider value={{ openContextMenu, openAtElement }}>
      <span onContextMenu={event => openContextMenu(event, path)}>{path}</span>
      {withMenuButton ? <NodeContextMenuTrigger path={path} /> : null}
      {contextMenu}
    </NodeContextMenuControlsProvider>
  );
}

function renderNodeContextMenu(options: HarnessOptions) {
  renderWithTheme(<TestHarness {...options} />);
}

describe('NodeContextMenu', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      ...initialWorkspaceState,
      cruiseSnapshot: CRUISE_TREE,
      selectedFilePaths: pathsToPresenceRecord(['src/a.ts', 'src/b/c.ts']),
      expandedFolderPaths: pathsToPresenceRecord(['src', 'src/b']),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens menu and shows folder-only actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderNodeContextMenu({ path: 'src/b' });

    fireEvent.contextMenu(screen.getByText('src/b'));

    expect(screen.getByText(i18n.current.t('actions.copyPath'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.collapse'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.expandRecursive'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.collapseRecursive'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.expandToLevel'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.collapseToLevel'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showInFileTree'))).toBeInTheDocument();
  });

  it('opens menu from the menu button', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderNodeContextMenu({
      path: 'src/a.ts',
      withMenuButton: true,
    });

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.openNodeMenu') }));

    expect(screen.getByText(i18n.current.t('actions.copyPath'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showInFileTree'))).toBeInTheDocument();
  });

  it('runs action from button-opened menu and closes', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { copyToClipboard } = await import('@/Shared');

    renderNodeContextMenu({
      path: 'src/a.ts',
      withMenuButton: true,
    });

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.openNodeMenu') }));
    fireEvent.click(screen.getByText(i18n.current.t('actions.copyPath')));

    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('runs action and closes menu', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { copyToClipboard } = await import('@/Shared');

    renderNodeContextMenu({ path: 'src/a.ts' });

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.copyPath')));

    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('hides folder actions for files', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderNodeContextMenu({ path: 'src/a.ts' });

    fireEvent.contextMenu(screen.getByText('src/a.ts'));

    expect(screen.queryByText(i18n.current.t('actions.expand'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.current.t('actions.expandRecursive'))).not.toBeInTheDocument();
  });

  it('shows hide and show-relation actions and runs them', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderNodeContextMenu({ path: 'src/a.ts' });

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    expect(screen.getByText(i18n.current.t('actions.hideOthers'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showDirectDependencies'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.showDirectDependents'))).toBeInTheDocument();

    fireEvent.click(screen.getByText(i18n.current.t('actions.hideOthers')));
    expect(workspaceActions.hideOthers).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.showDirectDependencies')));
    expect(workspaceActions.showDirectDependencies).toHaveBeenCalledWith('src/a.ts');

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.showDirectDependents')));
    expect(workspaceActions.showDirectDependents).toHaveBeenCalledWith('src/a.ts');
  });

  it('shows view module JSON and runs it', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onViewModuleJson = vi.fn();
    renderNodeContextMenu({
      path: 'src/a.ts',
      onViewModuleJson,
    });

    fireEvent.contextMenu(screen.getByText('src/a.ts'));
    fireEvent.click(screen.getByText(i18n.current.t('moduleJson.view')));

    expect(onViewModuleJson).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows auto layout actions for expanded folders when callbacks are provided', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onAutoLayoutGroup = vi.fn();
    const onAutoLayoutGroupRecursive = vi.fn();

    renderNodeContextMenu({
      path: 'src/b',
      onAutoLayoutGroup,
      onAutoLayoutGroupRecursive,
    });

    fireEvent.contextMenu(screen.getByText('src/b'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.autoLayout')));
    fireEvent.contextMenu(screen.getByText('src/b'));
    fireEvent.click(screen.getByText(i18n.current.t('actions.autoLayoutRecursive')));

    expect(onAutoLayoutGroup).toHaveBeenCalledWith('src/b');
    expect(onAutoLayoutGroupRecursive).toHaveBeenCalledWith('src/b');
  });

  it('hides auto layout actions when folder is collapsed', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    useWorkspaceStore.setState({
      expandedFolderPaths: pathsToPresenceRecord(['src']),
    });

    renderNodeContextMenu({
      path: 'src/b',
      onAutoLayoutGroup: vi.fn(),
      onAutoLayoutGroupRecursive: vi.fn(),
    });

    fireEvent.contextMenu(screen.getByText('src/b'));

    expect(screen.queryByText(i18n.current.t('actions.autoLayout'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.current.t('actions.autoLayoutRecursive'))).not.toBeInTheDocument();
  });

  it('does not propagate backdrop dismiss click to parent', () => {
    const onParentClick = vi.fn();

    renderWithTheme(
      <div onClick={onParentClick}>
        <TestHarness path="src/a.ts" />
      </div>,
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
