// @vitest-environment jsdom
import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen, waitFor } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { FolderLevelDialog } from './FolderLevelDialog';

describe('FolderLevelDialog', () => {
  it('shows folder paths as subtitle', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithTheme(
      <FolderLevelDialog open paths={['src/App', 'src/domain']} onClose={onClose} onConfirm={onConfirm} />,
    );

    expect(screen.getByText('src/App, src/domain')).toBeTruthy();
  });

  it('confirms a valid level and closes via onConfirm', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithTheme(<FolderLevelDialog open paths={['src']} onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText(i18n.current.t('folderLevel.level')), { target: { value: '3' } });

    const confirm = screen.getByRole('button', { name: i18n.current.t('folderLevel.confirm') });
    await waitFor(() => {
      expect(confirm).toBeEnabled();
    });
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(3);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('disables confirm for invalid level and cancels via close', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithTheme(<FolderLevelDialog open paths={['src']} onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText(i18n.current.t('folderLevel.level')), { target: { value: '0' } });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: i18n.current.t('folderLevel.confirm') })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.close') }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
