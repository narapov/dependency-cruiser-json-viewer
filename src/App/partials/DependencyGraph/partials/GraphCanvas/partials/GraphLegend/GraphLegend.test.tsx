// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { appStorageKey } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { GraphLegend } from './GraphLegend';

const STORAGE_KEY = appStorageKey('graph-legend-expanded');

describe('GraphLegend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts expanded by default and collapses on click', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<GraphLegend />);

    expect(screen.getByText(i18n.current.t('graph.legend.incoming'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.collapse') }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    expect(screen.getByRole('button', { name: i18n.current.t('actions.expand') })).toBeInTheDocument();
  });

  it('restores collapsed state from localStorage', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    localStorage.setItem(STORAGE_KEY, 'false');

    renderWithTheme(<GraphLegend />);

    expect(screen.getByRole('button', { name: i18n.current.t('actions.expand') })).toBeInTheDocument();
  });
});
