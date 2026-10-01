// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { useJsonDialog } from './useJsonDialog';

describe('useJsonDialog', () => {
  it('opens with defaults and closes', async () => {
    const { result } = renderHook(() =>
      useJsonDialog({ title: 'Cruise JSON', data: { modules: [] }, fullScreen: true }),
    );

    const { rerender } = renderWithTheme(<>{result.current.jsonDialog}</>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      result.current.openJsonDialog();
    });
    rerender(<>{result.current.jsonDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Cruise JSON')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
    });
    rerender(<>{result.current.jsonDialog}</>);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('opens with an override view payload', () => {
    const { result } = renderHook(() => useJsonDialog({ maxWidth: 'md' }));

    const { rerender } = renderWithTheme(<>{result.current.jsonDialog}</>);

    act(() => {
      result.current.openJsonDialog({ title: 'Module', data: { source: 'a.ts' } });
    });
    rerender(<>{result.current.jsonDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Module')).toBeInTheDocument();
  });
});
