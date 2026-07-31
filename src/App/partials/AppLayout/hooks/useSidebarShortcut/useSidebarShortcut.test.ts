// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook } from '@testing-library/react';

import { useSidebarShortcut } from './useSidebarShortcut';

describe('useSidebarShortcut', () => {
  it('toggles on Cmd+B', () => {
    const onToggle = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle }));

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('toggles on Ctrl+B', () => {
    const onToggle = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle }));

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const onToggle = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle }));

    fireEvent.keyDown(window, { key: 'b' });
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    const onToggle = vi.fn();
    const { unmount } = renderHook(() => useSidebarShortcut({ onToggle }));
    unmount();

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(onToggle).not.toHaveBeenCalled();
  });
});
