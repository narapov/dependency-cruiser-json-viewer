// @vitest-environment jsdom

import type { ICruiseResult, IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { useCruiseResultJsonDialog } from './useCruiseResultJsonDialog';
import { useModuleJsonDialog } from './useModuleJsonDialog';

function moduleAt(source: string): IModule {
  return { source, dependencies: [], dependents: [], valid: true } as IModule;
}

function cruiseSummary(totalCruised: number): ICruiseResult['summary'] {
  return {
    totalCruised,
    violations: [],
    error: 0,
    warn: 0,
    info: 0,
    ignore: 0,
    advisedExitCode: 0,
    optionsUsed: { args: '' },
    environment: {} as ICruiseResult['summary']['environment'],
  };
}

describe('cruise / module JSON dialogs from store', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
    useWorkspaceStore.getState().reset(
      {
        modules: [moduleAt('src/a.ts'), moduleAt('src/b/c.ts')],
        summary: cruiseSummary(2),
      } as ICruiseResult,
      'hard',
    );
  });

  it('opens cruise result JSON from the workspace store', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { result } = renderHook(() => useCruiseResultJsonDialog());

    const { rerender } = renderWithTheme(<>{result.current.cruiseResultJsonDialog}</>);

    act(() => {
      result.current.openViewCruiseResultJson();
    });
    rerender(<>{result.current.cruiseResultJsonDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('cruiseResultJson.title'))).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
    });
    rerender(<>{result.current.cruiseResultJsonDialog}</>);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('opens module JSON for a file path from the cruise snapshot', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { result } = renderHook(() => useModuleJsonDialog());

    const { rerender } = renderWithTheme(<>{result.current.moduleJsonDialog}</>);

    act(() => {
      result.current.openModuleJson('src/a.ts');
    });
    rerender(<>{result.current.moduleJsonDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('moduleJson.title', { path: 'src/a.ts' }))).toBeInTheDocument();
  });

  it('opens module JSON for a folder path from snapshot descendant modules', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { result } = renderHook(() => useModuleJsonDialog());

    const { rerender } = renderWithTheme(<>{result.current.moduleJsonDialog}</>);

    act(() => {
      result.current.openModuleJson('src/b');
    });
    rerender(<>{result.current.moduleJsonDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('moduleJson.title', { path: 'src/b' }))).toBeInTheDocument();
  });

  it('does not open module JSON for a path absent from the cruise snapshot', () => {
    const { result } = renderHook(() => useModuleJsonDialog());

    const { rerender } = renderWithTheme(<>{result.current.moduleJsonDialog}</>);

    act(() => {
      result.current.openModuleJson('src/missing.ts');
    });
    rerender(<>{result.current.moduleJsonDialog}</>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not open cruise JSON when the store has no cruise result', () => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
    const { result } = renderHook(() => useCruiseResultJsonDialog());

    const { rerender } = renderWithTheme(<>{result.current.cruiseResultJsonDialog}</>);

    act(() => {
      result.current.openViewCruiseResultJson();
    });
    rerender(<>{result.current.cruiseResultJsonDialog}</>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
