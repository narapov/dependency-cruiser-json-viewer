// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { HighlightsPanel } from './HighlightsPanel';

const sampleHighlights = new Map([
  ['src/a.ts->src/b.ts', '#ff0000'],
  ['src/c.ts->src/d.ts', '#00ff00'],
  ['src/e.ts->src/f.ts', '#ff0000'],
]);

describe('HighlightsPanel', () => {
  it('shows empty state when there are no highlights', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <HighlightsPanel
        highlights={new Map()}
        onRemoveDependencyKeys={vi.fn()}
        onShowConnection={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText(i18n.current.t('highlights.empty'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.current.t('highlights.clearAll') })).not.toBeInTheDocument();
  });

  it('keeps color groups expanded by default', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <HighlightsPanel
        highlights={sampleHighlights}
        onRemoveDependencyKeys={vi.fn()}
        onShowConnection={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText('src/a.ts → src/b.ts')).toBeInTheDocument();
    expect(screen.getByText('src/c.ts → src/d.ts')).toBeInTheDocument();
    expect(screen.getByText('src/e.ts → src/f.ts')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: i18n.current.t('actions.collapse') })).toHaveLength(2);
  });

  it('collapses and expands a color group', async () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <HighlightsPanel
        highlights={new Map([['src/a.ts->src/b.ts', '#ff0000']])}
        onRemoveDependencyKeys={vi.fn()}
        onShowConnection={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText('src/a.ts → src/b.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.collapse') }));
    expect(screen.getByRole('button', { name: i18n.current.t('actions.expand') })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('src/a.ts → src/b.ts')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expand') }));
    expect(screen.getByText('src/a.ts → src/b.ts')).toBeInTheDocument();
  });

  it('groups connections by color and removes a single connection', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onRemoveDependencyKeys = vi.fn();
    const onShowConnection = vi.fn();

    renderWithTheme(
      <HighlightsPanel
        highlights={sampleHighlights}
        onRemoveDependencyKeys={onRemoveDependencyKeys}
        onShowConnection={onShowConnection}
        onClearAll={vi.fn()}
      />,
    );

    const removeConnectionButtons = screen.getAllByRole('button', {
      name: i18n.current.t('highlights.removeConnection'),
    });
    fireEvent.click(removeConnectionButtons[0]!);

    expect(onRemoveDependencyKeys).toHaveBeenCalledWith(['src/a.ts->src/b.ts']);
    expect(onShowConnection).not.toHaveBeenCalled();
  });

  it('navigates to a connection when the row is clicked', () => {
    const onShowConnection = vi.fn();
    const onRemoveDependencyKeys = vi.fn();

    renderWithTheme(
      <HighlightsPanel
        highlights={sampleHighlights}
        onRemoveDependencyKeys={onRemoveDependencyKeys}
        onShowConnection={onShowConnection}
        onClearAll={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('src/a.ts → src/b.ts'));

    expect(onShowConnection).toHaveBeenCalledWith('src/a.ts', 'src/b.ts');
    expect(onRemoveDependencyKeys).not.toHaveBeenCalled();
  });

  it('removes an entire color group', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onRemoveDependencyKeys = vi.fn();

    renderWithTheme(
      <HighlightsPanel
        highlights={
          new Map([
            ['src/a.ts->src/b.ts', '#ff0000'],
            ['src/e.ts->src/f.ts', '#ff0000'],
            ['src/c.ts->src/d.ts', '#00ff00'],
          ])
        }
        onRemoveDependencyKeys={onRemoveDependencyKeys}
        onShowConnection={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    const removeColorButtons = screen.getAllByRole('button', {
      name: i18n.current.t('highlights.removeColor'),
    });
    fireEvent.click(removeColorButtons[0]!);

    expect(onRemoveDependencyKeys).toHaveBeenCalledWith(['src/a.ts->src/b.ts', 'src/e.ts->src/f.ts']);
  });

  it('clears all highlights', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClearAll = vi.fn();

    renderWithTheme(
      <HighlightsPanel
        highlights={new Map([['src/a.ts->src/b.ts', '#ff0000']])}
        onRemoveDependencyKeys={vi.fn()}
        onShowConnection={vi.fn()}
        onClearAll={onClearAll}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('highlights.clearAll') }));
    expect(onClearAll).toHaveBeenCalled();
  });
});
