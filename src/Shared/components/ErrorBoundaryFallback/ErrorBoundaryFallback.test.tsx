// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';

describe('ErrorBoundaryFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title, message and error stack', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const error = new Error('boom');
    error.stack = 'Error: boom\n    at test';

    renderWithTheme(<ErrorBoundaryFallback error={error} resetErrorBoundary={vi.fn()} />);

    expect(screen.getByText(i18n.current.t('app.errorBoundaryTitle'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('app.errorBoundaryMessage'))).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Error: boom');
    expect(screen.getByRole('alert')).toHaveTextContent('at test');
  });

  it('renders stringified non-Error values when stack is unavailable', () => {
    renderWithTheme(<ErrorBoundaryFallback error={'plain failure'} resetErrorBoundary={vi.fn()} />);

    expect(screen.getByText('plain failure')).toBeInTheDocument();
  });

  it('reloads the page when reload is clicked', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });

    renderWithTheme(<ErrorBoundaryFallback error={new Error('boom')} resetErrorBoundary={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('app.errorBoundaryReload') }));

    expect(reload).toHaveBeenCalled();
  });
});
