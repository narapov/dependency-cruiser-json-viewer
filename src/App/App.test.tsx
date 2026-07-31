// @vitest-environment jsdom
import type { ICruiseResult } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { CruiseResultParseError } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import App from './App';

const openFilePicker = vi.fn();
const useCruiseResult = vi.fn();

vi.mock('./hooks', () => ({
  useCruiseResult: (...args: unknown[]) => useCruiseResult(...args),
  useLoadCruiseResultFromFile: () => ({
    fileInputRef: { current: null },
    openFilePicker,
    handleFileSelect: vi.fn(),
    fileLoadError: null,
    clearFileLoadError: vi.fn(),
  }),
  useIgnorePatterns: () => ({ patterns: ['**/*.test.ts'], setPatterns: vi.fn() }),
  useInitialDependencyCruiserState: () => ({
    selectedKeys: ['src/a.ts'],
    expandedKeys: ['src'],
  }),
  useAppOrchestration: () => ({
    panelOpen: false,
    selectedPaths: ['src/a.ts'],
    expandedKeys: ['src'],
    activePath: 'src/a.ts',
    dependenciesPath: null,
    setSelectedPaths: vi.fn(),
    updateExpandedKeys: vi.fn(),
    activatePath: vi.fn(),
    showInGraph: vi.fn(),
    showInFileTree: vi.fn(),
    toggleFolder: vi.fn(),
    expandRecursive: vi.fn(),
    handleShowDependencies: vi.fn(),
    handleClosePanel: vi.fn(),
    handleQuickPickSelect: vi.fn(),
    focusActivePath: vi.fn(),
  }),
  useAppCommands: () => [],
}));

vi.mock('./partials/FileTree', () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock('./partials/DependencyGraph', () => ({
  DependencyGraph: () => <div data-testid="dependency-graph" />,
}));

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
    useSidebarOpen: () => ({ sidebarOpen: true, toggleSidebarOpen: vi.fn() }),
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

  it('renders main layout with filtered module count and opens about dialog', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    useCruiseResult.mockReturnValue({
      data: cruiseResult,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithTheme(<App />);

    expect(screen.getByTestId('file-tree')).toBeInTheDocument();
    expect(screen.getByTestId('dependency-graph')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('app.modulesCountFiltered', { filtered: 1, total: 2 }))).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(i18n.current.t('app.about')));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
