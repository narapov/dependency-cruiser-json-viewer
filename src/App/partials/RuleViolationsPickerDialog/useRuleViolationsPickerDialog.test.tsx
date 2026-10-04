// @vitest-environment jsdom

import type { ICruiseResult, IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { useRuleViolationsPickerDialog } from './useRuleViolationsPickerDialog';

describe('useRuleViolationsPickerDialog', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
    useWorkspaceStore.getState().reset(
      {
        modules: [
          { source: 'src/a.ts', dependencies: [], dependents: [], valid: true },
          { source: 'src/b.ts', dependencies: [], dependents: [], valid: true },
        ] as IModule[],
        summary: {
          totalCruised: 2,
          violations: [
            {
              type: 'dependency',
              rule: { name: 'no-circular', severity: 'error' },
              from: 'src/a.ts',
              to: 'src/b.ts',
            },
          ],
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
  });

  it('opens with store-derived rules and confirms selection', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useRuleViolationsPickerDialog({ onConfirm }));

    const { rerender } = renderWithTheme(<>{result.current.ruleViolationsPickerDialog}</>);

    act(() => {
      result.current.openRuleViolationsPicker();
    });
    rerender(<>{result.current.ruleViolationsPickerDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.confirm') });
    await waitFor(() => expect(confirm).toBeEnabled());
    await act(async () => {
      fireEvent.click(confirm);
    });

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(['no-circular']);
    });
  });
});
