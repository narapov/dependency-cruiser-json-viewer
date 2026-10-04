// @vitest-environment jsdom
import type { ICruiseResult } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { CruiseResultParseError } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import App from './App';
import { initialWorkspaceState, useWorkspaceStore } from './stores/workspaceStore';

const openFilePicker = vi.fn();
const openSettingsFilePicker = vi.fn();
const useCruiseResult = vi.fn();

vi.mock('./hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('./hooks')>();
  return {
    ...actual,
    useCruiseResult: (...args: unknown[]) => useCruiseResult(...args),
    useAppFileLoading: () => ({
      openLoadCruiseResult: () => {
        openFilePicker();
      },
      openLoadSettings: () => {
        openSettingsFilePicker();
      },
      isFileLoading: false,
      fileLoadError: null,
      clearFileLoadError: vi.fn(),
      isDraggingFile: false,
      isDropAllowed: true,
      cruiseFileInputRef: { current: null },
      handleCruiseFileSelect: vi.fn(),
      overlay: null,
    }),
    useCruiseResultUpdatedNotice: () => ({ notice: null, open: false }),
    useAppOrchestration: () => ({
      dependenciesPanelOpen: false,
      applicableRulesPanelOpen: false,
      selectedPaths: ['src/a.ts'],
      expandedKeys: ['src'],
      activePath: 'src/a.ts',
      dependenciesPath: null,
      applicableRulesPath: null,
      userEdgeHighlights: new Map(),
      folderBaseColors: {},
      setSelectedPaths: vi.fn(),
      activatePath: vi.fn(),
      showInGraph: vi.fn(),
      showInFileTree: vi.fn(),
      toggleFolder: vi.fn(),
      expandRecursive: vi.fn(),
      handleShowDependenciesPanel: vi.fn(),
      handleClosePanel: vi.fn(),
      handleShowApplicableRulesPanel: vi.fn(),
      handleCloseApplicableRulesPanel: vi.fn(),
      handleQuickPickSelect: vi.fn(),
      focusActivePath: vi.fn(),
      getCurrentWorkspaceSettings: vi.fn(() => null),
      setUserDependencyHighlight: vi.fn(),
      setUserEdgeHighlights: vi.fn(),
      clearAllHighlights: vi.fn(),
      viewActiveItemApplicableRulesPanel: vi.fn(),
      hideOthers: vi.fn(),
      showDirectDependencies: vi.fn(),
      showDirectDependents: vi.fn(),
      showPathsOnly: vi.fn(),
      showRuleViolationsOnly: vi.fn(),
    }),
    useAppCommands: () => [],
    useCruiseResultWatch: vi.fn(),
  };
});

vi.mock('./partials/FileTree', () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock('./partials/DependencyGraph', async importOriginal => {
  const actual = await importOriginal<typeof import('./partials/DependencyGraph')>();
  return {
    ...actual,
    DependencyGraph: () => <div data-testid="dependency-graph" />,
  };
});

vi.mock('./partials/QuickPick', () => ({
  QuickPick: () => null,
}));

vi.mock('./partials/CruiseResultFileInput', () => ({
  CruiseResultFileInput: () => null,
}));

vi.mock('./partials/AppLayout', async importOriginal => {
  const actual = await importOriginal<typeof import('./partials/AppLayout')>();
  return {
    ...actual,
    useSidebarOpen: () => ({ sidebarOpen: true, setSidebarOpen: vi.fn(), toggleSidebarOpen: vi.fn() }),
    useSidebarView: () => ({ sidebarView: 'files', setSidebarView: vi.fn() }),
    useSidebarShortcut: vi.fn(),
  };
});

const cruiseResult = {
  modules: [
    { source: 'src/a.ts', dependencies: [], dependents: [], valid: true },
    { source: 'src/b.test.ts', dependencies: [], dependents: [], valid: true },
  ],
  summary: {},
} as unknown as ICruiseResult;

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    openFilePicker.mockClear();
    useWorkspaceStore.setState({ ...initialWorkspaceState, userEdgeHighlights: new Map() });
  });

  it('shows loading state while cruise result is pending', () => {
    useCruiseResult.mockReturnValue({ data: undefined, isPending: true, isError: false, error: null });

    const { container } = renderWithTheme(<App />);

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  it('shows load prompt when cruise result is missing', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    useCruiseResult.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error('missing'),
    });

    renderWithTheme(<App />);

    expect(screen.getByText(i18n.current.t('app.noCruiseResultTitle'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('app.loadCruiseResult') }));
    expect(openFilePicker).toHaveBeenCalled();
  });

  it('shows parse error message for invalid cruise result format', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    useCruiseResult.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new CruiseResultParseError('invalidFormat'),
    });

    renderWithTheme(<App />);

    expect(screen.getByText(i18n.current.t('app.invalidCruiseResultFormat'))).toBeInTheDocument();
  });

  it('renders main layout with filtered module count and opens about dialog', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    useCruiseResult.mockReturnValue({
      data: cruiseResult,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithTheme(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('file-tree')).toBeInTheDocument();
    });
    expect(screen.getByTestId('dependency-graph')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('app.modulesCountFiltered', { filtered: 2, total: 2 }))).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(i18n.current.t('app.about')));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
