// @vitest-environment jsdom

import { createRef } from 'react';
import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { CruiseResultParseError } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import type { CruiseResultFileInputHandle } from '../CruiseResultFileInput';
import { CruiseResultEmptyState } from './CruiseResultEmptyState';

describe('CruiseResultEmptyState', () => {
  it('renders the load button when watch is off', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onLoadCruiseResult = vi.fn();

    renderWithTheme(
      <CruiseResultEmptyState
        error={new Error('missing')}
        cruiseWatchEnabled={false}
        isFileLoading={false}
        fileLoadError={null}
        isDraggingFile={false}
        isDropAllowed={false}
        onLoadCruiseResult={onLoadCruiseResult}
        cruiseFileInputRef={createRef<CruiseResultFileInputHandle>()}
        onCruiseFileSelect={vi.fn()}
      />,
    );

    const loadButton = screen.getByRole('button', { name: i18n.current.t('app.loadCruiseResult') });
    expect(loadButton).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('app.noCruiseResultTitle'))).toBeInTheDocument();

    fireEvent.click(loadButton);
    expect(onLoadCruiseResult).toHaveBeenCalled();
  });

  it('hides the load button when watch mode is enabled', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <CruiseResultEmptyState
        error={new Error('missing')}
        cruiseWatchEnabled
        isFileLoading={false}
        fileLoadError={null}
        isDraggingFile={false}
        isDropAllowed={false}
        onLoadCruiseResult={vi.fn()}
        cruiseFileInputRef={createRef<CruiseResultFileInputHandle>()}
        onCruiseFileSelect={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: i18n.current.t('app.loadCruiseResult') })).not.toBeInTheDocument();
  });

  it('shows parse error message for invalid cruise result format', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <CruiseResultEmptyState
        error={new CruiseResultParseError('invalidFormat')}
        cruiseWatchEnabled={false}
        isFileLoading={false}
        fileLoadError={null}
        isDraggingFile={false}
        isDropAllowed={false}
        onLoadCruiseResult={vi.fn()}
        cruiseFileInputRef={createRef<CruiseResultFileInputHandle>()}
        onCruiseFileSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(i18n.current.t('app.invalidCruiseResultFormat'))).toBeInTheDocument();
  });
});
