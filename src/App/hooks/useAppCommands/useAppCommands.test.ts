// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

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
    exportGraphDot: vi.fn(),
    viewGraphDotOnline: vi.fn(),
    saveWorkspace: vi.fn(),
    expandAllRecursive: vi.fn(),
    collapseAllRecursive: vi.fn(),
    selectAll: vi.fn(),
    unselectAll: vi.fn(),
    showCircularDependenciesOnly: vi.fn(),
  };
}

describe('useAppCommands', () => {
  it('returns sorted commands with expected ids', () => {
    const orch = createOrch();
    const openThemePicker = vi.fn();
    const openLanguagePicker = vi.fn();
    const openIgnorePatterns = vi.fn();
    const openLoadCruiseResult = vi.fn();
    const openLoadSettings = vi.fn();
    const openAbout = vi.fn();
    const showFileTree = vi.fn();
    const showRulesPanel = vi.fn();
    const showCircularPanel = vi.fn();
    const toggleSidebar = vi.fn();

    const { result } = renderHook(() =>
      useAppCommands({
        orch,
        openThemePicker,
        openLanguagePicker,
        openIgnorePatterns,
        openLoadCruiseResult,
        openLoadSettings,
        openAbout,
        showFileTree,
        showRulesPanel,
        showCircularPanel,
        toggleSidebar,
      }),
    );

    const ids = result.current.map(command => command.id);
    expect(ids).toContain('exportGraphDot');
    expect(ids).toContain('viewGraphDotOnline');
    expect(ids).toContain('saveWorkspace');
    expect(ids).toContain('loadWorkspaceSettings');
    expect(ids).toContain('selectAll');
    expect(ids).toContain('showCircularDependenciesOnly');
    expect(ids).toContain('setTheme');
    expect(ids).toContain('about');
    expect(ids).toContain('showFileTree');
    expect(ids).toContain('showRulesPanel');
    expect(ids).toContain('showCircularPanel');
    expect(ids).toContain('toggleSidebar');

    const labels = result.current.map(command => command.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
  });

  it('wires command actions to orchestration and dialog openers', () => {
    const orch = createOrch();
    const openThemePicker = vi.fn();
    const openAbout = vi.fn();
    const openLoadSettings = vi.fn();
    const showFileTree = vi.fn();
    const showRulesPanel = vi.fn();
    const showCircularPanel = vi.fn();
    const toggleSidebar = vi.fn();

    const { result } = renderHook(() =>
      useAppCommands({
        orch,
        openThemePicker,
        openLanguagePicker: vi.fn(),
        openIgnorePatterns: vi.fn(),
        openLoadCruiseResult: vi.fn(),
        openLoadSettings,
        openAbout,
        showFileTree,
        showRulesPanel,
        showCircularPanel,
        toggleSidebar,
      }),
    );

    const byId = Object.fromEntries(result.current.map(command => [command.id, command]));

    byId.selectAll.onExecute();
    byId.showCircularDependenciesOnly.onExecute();
    byId.setTheme.onExecute();
    byId.about.onExecute();
    byId.showFileTree.onExecute();
    byId.showRulesPanel.onExecute();
    byId.showCircularPanel.onExecute();
    byId.toggleSidebar.onExecute();
    byId.copyActive.onExecute();
    byId.exportGraphDot.onExecute();
    byId.viewGraphDotOnline.onExecute();
    byId.saveWorkspace.onExecute();
    byId.loadWorkspaceSettings.onExecute();

    expect(orch.selectAll).toHaveBeenCalled();
    expect(orch.showCircularDependenciesOnly).toHaveBeenCalled();
    expect(openThemePicker).toHaveBeenCalled();
    expect(openAbout).toHaveBeenCalled();
    expect(showFileTree).toHaveBeenCalled();
    expect(showRulesPanel).toHaveBeenCalled();
    expect(showCircularPanel).toHaveBeenCalled();
    expect(toggleSidebar).toHaveBeenCalled();
    expect(orch.copyActive).toHaveBeenCalled();
    expect(orch.exportGraphDot).toHaveBeenCalled();
    expect(orch.viewGraphDotOnline).toHaveBeenCalled();
    expect(orch.saveWorkspace).toHaveBeenCalled();
    expect(openLoadSettings).toHaveBeenCalled();
  });

  it('disables load commands while a file load is in progress', () => {
    const { result } = renderHook(() =>
      useAppCommands({
        orch: createOrch(),
        openThemePicker: vi.fn(),
        openLanguagePicker: vi.fn(),
        openIgnorePatterns: vi.fn(),
        openLoadCruiseResult: vi.fn(),
        openLoadSettings: vi.fn(),
        openAbout: vi.fn(),
        showFileTree: vi.fn(),
        showRulesPanel: vi.fn(),
        showCircularPanel: vi.fn(),
        toggleSidebar: vi.fn(),
        fileLoadInProgress: true,
      }),
    );

    const byId = Object.fromEntries(result.current.map(command => [command.id, command]));
    expect(byId.loadCruiseResult.disabled).toBe(true);
    expect(byId.loadWorkspaceSettings.disabled).toBe(true);
    expect(byId.saveWorkspace.disabled).toBeUndefined();
  });

  it('omits loadCruiseResult when cruise watch is enabled', () => {
    const { result } = renderHook(() =>
      useAppCommands({
        orch: createOrch(),
        openThemePicker: vi.fn(),
        openLanguagePicker: vi.fn(),
        openIgnorePatterns: vi.fn(),
        openLoadCruiseResult: vi.fn(),
        openLoadSettings: vi.fn(),
        openAbout: vi.fn(),
        showFileTree: vi.fn(),
        showRulesPanel: vi.fn(),
        showCircularPanel: vi.fn(),
        toggleSidebar: vi.fn(),
        cruiseWatchEnabled: true,
      }),
    );

    const ids = result.current.map(command => command.id);
    expect(ids).not.toContain('loadCruiseResult');
    expect(ids).toContain('loadWorkspaceSettings');
  });
});
