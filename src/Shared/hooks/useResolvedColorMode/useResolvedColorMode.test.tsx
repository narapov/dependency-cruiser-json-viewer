// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { renderHook } from '@testing-library/react';

import { muiTheme } from '../../styles/muiTheme';
import { useResolvedColorMode } from './useResolvedColorMode';

describe('useResolvedColorMode', () => {
  it('returns light for defaultMode light', () => {
    const { result } = renderHook(() => useResolvedColorMode(), {
      wrapper: ({ children }) => (
        <ThemeProvider theme={muiTheme} defaultMode="light">
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current).toBe('light');
  });

  it('returns dark for defaultMode dark', () => {
    const { result } = renderHook(() => useResolvedColorMode(), {
      wrapper: ({ children }) => (
        <ThemeProvider theme={muiTheme} defaultMode="dark">
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current).toBe('dark');
  });
});
