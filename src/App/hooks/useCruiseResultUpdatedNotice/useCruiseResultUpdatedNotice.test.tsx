// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useCruiseResultUpdatedNotice } from './useCruiseResultUpdatedNotice';

describe('useCruiseResultUpdatedNotice', () => {
  it('skips the initial data emission and opens on a subsequent change when watch is enabled', () => {
    const { result, rerender } = renderHook(
      ({ data, cruiseWatchEnabled }) => useCruiseResultUpdatedNotice({ data, cruiseWatchEnabled }),
      { initialProps: { data: { v: 1 }, cruiseWatchEnabled: true } },
    );

    expect(result.current.open).toBe(false);

    rerender({ data: { v: 2 }, cruiseWatchEnabled: true });
    expect(result.current.open).toBe(true);
  });

  it('does not open when watch is disabled', () => {
    const { result, rerender } = renderHook(
      ({ data, cruiseWatchEnabled }) => useCruiseResultUpdatedNotice({ data, cruiseWatchEnabled }),
      { initialProps: { data: { v: 1 }, cruiseWatchEnabled: false } },
    );

    rerender({ data: { v: 2 }, cruiseWatchEnabled: false });
    expect(result.current.open).toBe(false);
  });
});
