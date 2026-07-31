// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useAppCommands, type AppCommandsOrchestration } from './useAppCommands';

function createOrch(): AppCommandsOrchestration {
  return {
    clearLocalStorage: vi.fn(),
    focusActivePath: vi.fn(),
    copyActive: vi.fn(),
    viewActiveDependencies: vi.fn(),
    expandActive: vi.fn(),
    expandActiveRecursive: vi.fn(),
    collapseActive: vi.fn(),
    collapseActiveRecursive: vi.fn(),
    clearAllHighlights: vi.fn(),
    expandAllRecursive: vi.fn(),
    collapseAllRecursive: vi.fn(),
    selectAll: vi.fn(),
    unselectAll: vi.fn(),
  };
}

describe('useAppCommands', () => {
  afterEach(() => {
    cleanup();
  });

  it('returns sorted commands with expected ids', () => {
    const orch = createOrch();
    const openThemePicker = vi.fn();
    const openLanguagePicker = vi.fn();
    const openIgnorePatterns = vi.fn();
    const openLoadCruiseResult = vi.fn();
    const openAbout = vi.fn();
    const toggleFileTree = vi.fn();

    const { result } = renderHook(() =>
      useAppCommands({
        orch,
        openThemePicker,
        openLanguagePicker,
        openIgnorePatterns,
        openLoadCruiseResult,
        openAbout,
        toggleFileTree,
      }),
    );

    const ids = result.current.map(command => command.id);
    expect(ids).toContain('selectAll');
    expect(ids).toContain('setTheme');
    expect(ids).toContain('about');
    expect(ids).toContain('toggleFileTree');

    const labels = result.current.map(command => command.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
  });

  it('wires command actions to orchestration and dialog openers', () => {
    const orch = createOrch();
    const openThemePicker = vi.fn();
    const openAbout = vi.fn();
    const toggleFileTree = vi.fn();

    const { result } = renderHook(() =>
      useAppCommands({
        orch,
        openThemePicker,
        openLanguagePicker: vi.fn(),
        openIgnorePatterns: vi.fn(),
        openLoadCruiseResult: vi.fn(),
        openAbout,
        toggleFileTree,
      }),
    );

    const byId = Object.fromEntries(result.current.map(command => [command.id, command]));

    byId.selectAll.onExecute();
    byId.setTheme.onExecute();
    byId.about.onExecute();
    byId.toggleFileTree.onExecute();
    byId.copyActive.onExecute();

    expect(orch.selectAll).toHaveBeenCalled();
    expect(openThemePicker).toHaveBeenCalled();
    expect(openAbout).toHaveBeenCalled();
    expect(toggleFileTree).toHaveBeenCalled();
    expect(orch.copyActive).toHaveBeenCalled();
  });
});
