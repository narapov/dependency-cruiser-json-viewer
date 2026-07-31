// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { AboutDialog } from './AboutDialog';

describe('AboutDialog', () => {
  it('renders about content when open', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<AboutDialog open onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('about.title'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('app.title'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('about.version', { version: __APP_VERSION__ }))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('about.commit', { hash: __APP_COMMIT_HASH__ }))).toBeInTheDocument();
  });

  it('does not render dialog content when closed', () => {
    renderWithTheme(<AboutDialog open={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();

    renderWithTheme(<AboutDialog open onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.close') }));

    expect(onClose).toHaveBeenCalled();
  });
});
