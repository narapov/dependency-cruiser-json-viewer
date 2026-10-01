// @vitest-environment jsdom

import type { ICruiseResult, IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { useCruiseResultJsonDialog } from './useCruiseResultJsonDialog';
import { useModuleJsonDialog } from './useModuleJsonDialog';

describe('cruise / module JSON dialogs from store', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
    useWorkspaceStore.getState().reset(
      {
        modules: [{ source: 'src/a.ts', dependencies: [], dependents: [], valid: true }] as IModule[],
        summary: {
          totalCruised: 1,
          violations: [],
          error: 0,
          warn: 0,
          info: 0,
          ignore: 0,
          optionsUsed: { args: '' },
          environment: {} as ICruiseResult['summary']['environment'],
        },
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

  it('opens module JSON from the workspace store modules', () => {
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
