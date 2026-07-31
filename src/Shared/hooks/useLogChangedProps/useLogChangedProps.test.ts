// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useLogChangedProps } from './useLogChangedProps';

const mocks = vi.hoisted(() => ({
  NEED_PROFILE: false,
}));

vi.mock('../../constants/needProfile', () => ({
  get NEED_PROFILE() {
    return mocks.NEED_PROFILE;
  },
}));

describe('useLogChangedProps', () => {
  beforeEach(() => {
    mocks.NEED_PROFILE = false;
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does nothing when NEED_PROFILE is false', () => {
    const { rerender } = renderHook(
      ({ label, props }) => {
        useLogChangedProps(label, props);
      },
      { initialProps: { label: 'Graph', props: { a: 1 } } },
    );

    rerender({ label: 'Graph', props: { a: 2 } });

    expect(console.log).not.toHaveBeenCalled();
  });

  it('does not log on the first profiled render', () => {
    mocks.NEED_PROFILE = true;

    renderHook(
      ({ label, props }) => {
        useLogChangedProps(label, props);
      },
      { initialProps: { label: 'Graph', props: { a: 1 } } },
    );

    expect(console.log).not.toHaveBeenCalled();
  });

  it('logs changed prop keys on subsequent renders', () => {
    mocks.NEED_PROFILE = true;

    const { rerender } = renderHook(
      ({ label, props }) => {
        useLogChangedProps(label, props);
      },
      { initialProps: { label: 'Graph', props: { a: 1, b: 2 } } },
    );

    rerender({ label: 'Graph', props: { a: 1, b: 3 } });

    expect(console.log).toHaveBeenCalledWith('[Graph] props changed:', ['b']);
  });

  it('logs when a re-render happens with unchanged props', () => {
    mocks.NEED_PROFILE = true;

    const { rerender } = renderHook(
      ({ label, props }) => {
        useLogChangedProps(label, props);
      },
      { initialProps: { label: 'Graph', props: { a: 1 } } },
    );

    rerender({ label: 'Graph', props: { a: 1 } });

    expect(console.log).toHaveBeenCalledWith('[Graph] re-render, no props changed');
  });

  it('treats equal values by Object.is (including NaN)', () => {
    mocks.NEED_PROFILE = true;

    const { rerender } = renderHook(
      ({ label, props }) => {
        useLogChangedProps(label, props);
      },
      { initialProps: { label: 'Graph', props: { value: Number.NaN } } },
    );

    rerender({ label: 'Graph', props: { value: Number.NaN } });

    expect(console.log).toHaveBeenCalledWith('[Graph] re-render, no props changed');
  });
});
