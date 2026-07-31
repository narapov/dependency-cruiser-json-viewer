// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { IgnorePatternsDialog } from './IgnorePatternsDialog';

describe('IgnorePatternsDialog', () => {
  it('saves trimmed non-empty lines as patterns', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSave = vi.fn();
    const onClose = vi.fn();

    renderWithTheme(<IgnorePatternsDialog open patterns={['node_modules']} onClose={onClose} onSave={onSave} />);

    const field = screen.getByDisplayValue('node_modules');
    fireEvent.change(field, { target: { value: '  dist/**  \n\n  *.map  \n' } });
    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('ignorePatterns.save') }));

    expect(onSave).toHaveBeenCalledWith(['dist/**', '*.map']);
    expect(onClose).toHaveBeenCalled();
  });

  it('cancels without saving', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSave = vi.fn();
    const onClose = vi.fn();

    renderWithTheme(<IgnorePatternsDialog open patterns={['a']} onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('ignorePatterns.cancel') }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('resets draft when reopened with new patterns key', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { rerender } = renderWithTheme(
      <IgnorePatternsDialog open patterns={['one']} onClose={onClose} onSave={onSave} />,
    );

    const field = screen.getByDisplayValue('one');
    fireEvent.change(field, { target: { value: 'edited' } });

    rerender(<IgnorePatternsDialog open patterns={['two']} onClose={onClose} onSave={onSave} />);

    expect(screen.getByDisplayValue('two')).toBeInTheDocument();
  });
});
