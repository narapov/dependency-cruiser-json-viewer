// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { DependencyPanelHeader } from './DependencyPanelHeader';

describe('DependencyPanelHeader', () => {
  it('renders path and invokes actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();
    const onShowInGraph = vi.fn();

    renderWithTheme(<DependencyPanelHeader path="src/foo/a.ts" onClose={onClose} onShowInGraph={onShowInGraph} />);

    expect(screen.getByText('src/foo/a.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.showInGraph') }));
    expect(onShowInGraph).toHaveBeenCalledWith('src/foo/a.ts');

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.close') }));
    expect(onClose).toHaveBeenCalled();
  });
});
