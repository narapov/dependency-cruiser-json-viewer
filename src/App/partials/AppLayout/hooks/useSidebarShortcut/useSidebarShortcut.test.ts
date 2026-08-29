// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook } from '@testing-library/react';

import { useSidebarShortcut } from './useSidebarShortcut';

function renderShortcut() {
  const onToggle = vi.fn();
  const onShowFileTree = vi.fn();
  const onShowRulesPanel = vi.fn();
  const onShowCircularPanel = vi.fn();
  const onShowHighlightsPanel = vi.fn();
  const hook = renderHook(() =>
    useSidebarShortcut({
      onToggle,
      onShowFileTree,
      onShowRulesPanel,
      onShowCircularPanel,
      onShowHighlightsPanel,
    }),
  );
  return {
    ...hook,
    onToggle,
    onShowFileTree,
    onShowRulesPanel,
    onShowCircularPanel,
    onShowHighlightsPanel,
  };
}

describe('useSidebarShortcut', () => {
  it('toggles on Cmd+B', () => {
    const { onToggle } = renderShortcut();

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('toggles on Ctrl+B', () => {
    const { onToggle } = renderShortcut();

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows file tree on Cmd+Shift+E', () => {
    const { onToggle, onShowFileTree, onShowRulesPanel, onShowCircularPanel, onShowHighlightsPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'e', metaKey: true, shiftKey: true });
    expect(onShowFileTree).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowRulesPanel).not.toHaveBeenCalled();
    expect(onShowCircularPanel).not.toHaveBeenCalled();
    expect(onShowHighlightsPanel).not.toHaveBeenCalled();
  });

  it('shows file tree on Ctrl+Shift+E', () => {
    const { onShowFileTree } = renderShortcut();

    fireEvent.keyDown(window, { key: 'E', ctrlKey: true, shiftKey: true });
    expect(onShowFileTree).toHaveBeenCalledTimes(1);
  });

  it('shows rules panel on Cmd+Shift+M', () => {
    const { onToggle, onShowFileTree, onShowRulesPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'm', metaKey: true, shiftKey: true });
    expect(onShowRulesPanel).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowFileTree).not.toHaveBeenCalled();
  });

  it('shows rules panel on Ctrl+Shift+M', () => {
    const { onShowRulesPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'M', ctrlKey: true, shiftKey: true });
    expect(onShowRulesPanel).toHaveBeenCalledTimes(1);
  });

  it('shows circular panel on Cmd+Shift+C', () => {
    const { onToggle, onShowCircularPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'c', metaKey: true, shiftKey: true });
    expect(onShowCircularPanel).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows circular panel on Ctrl+Shift+C', () => {
    const { onShowCircularPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'C', ctrlKey: true, shiftKey: true });
    expect(onShowCircularPanel).toHaveBeenCalledTimes(1);
  });

  it('shows highlights panel on Cmd+Shift+H', () => {
    const { onToggle, onShowHighlightsPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'h', metaKey: true, shiftKey: true });
    expect(onShowHighlightsPanel).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows highlights panel on Ctrl+Shift+H', () => {
    const { onShowHighlightsPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'H', ctrlKey: true, shiftKey: true });
    expect(onShowHighlightsPanel).toHaveBeenCalledTimes(1);
  });

  it('ignores Cmd+Shift+B', () => {
    const { onToggle } = renderShortcut();

    fireEvent.keyDown(window, { key: 'b', metaKey: true, shiftKey: true });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const { onToggle, onShowFileTree, onShowRulesPanel, onShowCircularPanel, onShowHighlightsPanel } = renderShortcut();

    fireEvent.keyDown(window, { key: 'b' });
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    fireEvent.keyDown(window, { key: 'e', metaKey: true });
    fireEvent.keyDown(window, { key: 'm', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'c', metaKey: true });
    fireEvent.keyDown(window, { key: 'h', metaKey: true });
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowFileTree).not.toHaveBeenCalled();
    expect(onShowRulesPanel).not.toHaveBeenCalled();
    expect(onShowCircularPanel).not.toHaveBeenCalled();
    expect(onShowHighlightsPanel).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    const { unmount, onToggle, onShowFileTree, onShowRulesPanel, onShowCircularPanel, onShowHighlightsPanel } =
      renderShortcut();
    unmount();

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    fireEvent.keyDown(window, { key: 'e', metaKey: true, shiftKey: true });
    fireEvent.keyDown(window, { key: 'm', metaKey: true, shiftKey: true });
    fireEvent.keyDown(window, { key: 'c', metaKey: true, shiftKey: true });
    fireEvent.keyDown(window, { key: 'h', metaKey: true, shiftKey: true });
    expect(onToggle).not.toHaveBeenCalled();
    expect(onShowFileTree).not.toHaveBeenCalled();
    expect(onShowRulesPanel).not.toHaveBeenCalled();
    expect(onShowCircularPanel).not.toHaveBeenCalled();
    expect(onShowHighlightsPanel).not.toHaveBeenCalled();
  });
});
