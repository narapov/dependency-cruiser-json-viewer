// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { RuleViolationsPickerDialog, type RuleViolationsPickerOption } from './RuleViolationsPickerDialog';

const rules: RuleViolationsPickerOption[] = [
  { name: 'domain-only-domain', severity: 'error', violationCount: 2 },
  { name: 'no-circular', severity: 'warn', violationCount: 1 },
];

describe('RuleViolationsPickerDialog', () => {
  it('selects all rules by default and confirms selected names', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderWithTheme(<RuleViolationsPickerDialog open rules={rules} onClose={onClose} onConfirm={onConfirm} />);

    const confirm = screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.confirm') });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(['domain-only-domain', 'no-circular']);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('deselects all and disables confirm', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onConfirm = vi.fn();

    renderWithTheme(<RuleViolationsPickerDialog open rules={rules} onClose={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.deselectAll') }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.confirm') })).toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.confirm') }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('toggles individual rules and confirms the remaining selection', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onConfirm = vi.fn();

    renderWithTheme(<RuleViolationsPickerDialog open rules={rules} onClose={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('domain-only-domain'));
    const confirm = screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.confirm') });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(['no-circular']);
    });
  });

  it('selects all after deselect', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onConfirm = vi.fn();

    renderWithTheme(<RuleViolationsPickerDialog open rules={rules} onClose={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.deselectAll') }));
    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.selectAll') }));
    const confirm = screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.confirm') });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(['domain-only-domain', 'no-circular']);
    });
  });

  it('shows empty state when there are no rules', async () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<RuleViolationsPickerDialog open rules={[]} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText(i18n.current.t('ruleViolationsPicker.empty'))).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: i18n.current.t('ruleViolationsPicker.confirm') })).toBeDisabled();
    });
  });
});
