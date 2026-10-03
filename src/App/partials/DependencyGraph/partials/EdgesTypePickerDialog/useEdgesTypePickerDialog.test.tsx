// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { useEdgesTypePickerDialog } from './useEdgesTypePickerDialog';

describe('useEdgesTypePickerDialog', () => {
  it('opens edges type picker via opener and closes it', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { result } = renderHook(() => useEdgesTypePickerDialog());

    const { rerender } = renderWithTheme(<>{result.current.edgesTypePickerDialog}</>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      result.current.openEdgesTypePicker();
    });
    rerender(<>{result.current.edgesTypePickerDialog}</>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('graph.selectEdgesType'))).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('listbox').parentElement!, { key: 'Escape' });
    });
    rerender(<>{result.current.edgesTypePickerDialog}</>);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
