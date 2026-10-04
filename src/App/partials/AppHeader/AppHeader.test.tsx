// @vitest-environment jsdom

import type { ICruiseResult, IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { AppHeader } from './AppHeader';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    getWindowEnvs: vi.fn(() => undefined),
  };
});

describe('AppHeader', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows filtered module counts from the workspace store and wires action callbacks', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onOpenFileSearch = vi.fn();
    const onOpenCommandPalette = vi.fn();
    const onOpenIgnorePatterns = vi.fn();
    const onOpenAbout = vi.fn();

    useWorkspaceStore.getState().reset(
      {
        modules: [
          { source: 'src/a.ts', dependencies: [], dependents: [], valid: true },
          { source: 'src/b.test.ts', dependencies: [], dependents: [], valid: true },
        ] as IModule[],
        summary: {
          totalCruised: 2,
          violations: [],
          error: 0,
          warn: 0,
          info: 0,
          ignore: 0,
          advisedExitCode: 0,
          optionsUsed: { args: '' },
          environment: {} as ICruiseResult['summary']['environment'],
        },
      } as ICruiseResult,
      'hard',
    );
    useWorkspaceStore.getState().setIgnorePatterns(['**/*.test.ts']);

    renderWithTheme(
      <AppHeader
        onOpenFileSearch={onOpenFileSearch}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenIgnorePatterns={onOpenIgnorePatterns}
        onOpenAbout={onOpenAbout}
      />,
    );

    expect(
      screen.getByText(
        i18n.current.t('app.modulesCountFiltered', {
          filtered: 1,
          total: 2,
        }),
      ),
    ).toBeInTheDocument();

    const { formatShortcut } = await import('@/Shared');
    const ignoreButton = screen.getByRole('button', {
      name: i18n.current.t('ignorePatterns.setIgnorePatterns'),
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.current.t('app.searchFiles', { shortcut: formatShortcut('P') }),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('app.commandPalette') }));
    fireEvent.click(ignoreButton);
    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('app.about') }));

    expect(onOpenFileSearch).toHaveBeenCalled();
    expect(onOpenCommandPalette).toHaveBeenCalled();
    expect(onOpenIgnorePatterns).toHaveBeenCalled();
    expect(onOpenAbout).toHaveBeenCalled();
  });

  it('shows watch mode when window envs enable watch', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { getWindowEnvs } = await import('@/Shared');
    vi.mocked(getWindowEnvs).mockReturnValue({ watch: true });

    renderWithTheme(
      <AppHeader
        onOpenFileSearch={vi.fn()}
        onOpenCommandPalette={vi.fn()}
        onOpenIgnorePatterns={vi.fn()}
        onOpenAbout={vi.fn()}
      />,
    );

    expect(screen.getByText(i18n.current.t('app.watchMode'))).toBeInTheDocument();
  });
});
