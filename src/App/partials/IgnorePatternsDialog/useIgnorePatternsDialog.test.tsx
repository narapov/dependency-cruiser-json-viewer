// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { useIgnorePatternsDialog } from './useIgnorePatternsDialog';

describe('useIgnorePatternsDialog', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState, ignorePatterns: ['**/*.test.ts'] });
  });

  it('opens and closes the ignore patterns dialog using store patterns', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { result } = renderHook(() => useIgnorePatternsDialog());

    const { rerender } = renderWithTheme(<>{result.current.ignorePatternsDialog}</>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      result.current.openIgnorePatterns();
    });
    rerender(<>{result.current.ignorePatternsDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: i18n.current.t('ignorePatterns.cancel') }));
    });
    rerender(<>{result.current.ignorePatternsDialog}</>);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
