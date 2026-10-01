// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { renderWithTheme } from '@/testsUtils';

import { CruiseResultLoading } from './CruiseResultLoading';

describe('CruiseResultLoading', () => {
  it('renders a progress indicator', () => {
    const { container } = renderWithTheme(<CruiseResultLoading isDraggingFile={false} isDropAllowed={false} />);

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });
});
