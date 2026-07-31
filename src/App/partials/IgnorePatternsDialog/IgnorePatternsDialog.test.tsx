// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { IgnorePatternsDialog } from './IgnorePatternsDialog';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('IgnorePatternsDialog', () => {
  afterEach(() => {
    cleanup();
  });

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

    rerender(
      <ThemeProvider theme={muiTheme} defaultMode="light">
        <IgnorePatternsDialog open patterns={['two']} onClose={onClose} onSave={onSave} />
      </ThemeProvider>,
    );

    expect(screen.getByDisplayValue('two')).toBeInTheDocument();
  });
});
