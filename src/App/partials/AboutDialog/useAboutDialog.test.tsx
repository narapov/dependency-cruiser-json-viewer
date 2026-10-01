// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { useAboutDialog } from './useAboutDialog';

describe('useAboutDialog', () => {
  it('opens About dialog via opener and closes it', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { result } = renderHook(() => useAboutDialog());

    const { rerender } = renderWithTheme(<>{result.current.aboutDialog}</>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      result.current.openAbout();
    });
    rerender(<>{result.current.aboutDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('about.title'))).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.close') }));
    });
    rerender(<>{result.current.aboutDialog}</>);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
