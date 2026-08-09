// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook } from '@testing-library/react';

import { useSidebarShortcut } from './useSidebarShortcut';

describe('useSidebarShortcut', () => {
  it('toggles on Cmd+B', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('toggles on Ctrl+B', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows file tree on Cmd+Shift+E', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'e', metaKey: true, shiftKey: true });
    expect(onShowFileTree).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowRulesPanel).not.toHaveBeenCalled();
  });

  it('shows file tree on Ctrl+Shift+E', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'E', ctrlKey: true, shiftKey: true });
    expect(onShowFileTree).toHaveBeenCalledTimes(1);
  });

  it('shows rules panel on Cmd+Shift+M', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'm', metaKey: true, shiftKey: true });
    expect(onShowRulesPanel).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowFileTree).not.toHaveBeenCalled();
  });

  it('shows rules panel on Ctrl+Shift+M', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'M', ctrlKey: true, shiftKey: true });
    expect(onShowRulesPanel).toHaveBeenCalledTimes(1);
  });

  it('ignores Cmd+Shift+B', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'b', metaKey: true, shiftKey: true });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));

    fireEvent.keyDown(window, { key: 'b' });
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    fireEvent.keyDown(window, { key: 'e', metaKey: true });
    fireEvent.keyDown(window, { key: 'm', ctrlKey: true });
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowFileTree).not.toHaveBeenCalled();
    expect(onShowRulesPanel).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    const onToggle = vi.fn();
    const onShowFileTree = vi.fn();
    const onShowRulesPanel = vi.fn();
    const { unmount } = renderHook(() => useSidebarShortcut({ onToggle, onShowFileTree, onShowRulesPanel }));
    unmount();

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    fireEvent.keyDown(window, { key: 'e', metaKey: true, shiftKey: true });
    fireEvent.keyDown(window, { key: 'm', metaKey: true, shiftKey: true });
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowFileTree).not.toHaveBeenCalled();
    expect(onShowRulesPanel).not.toHaveBeenCalled();
  });
});
