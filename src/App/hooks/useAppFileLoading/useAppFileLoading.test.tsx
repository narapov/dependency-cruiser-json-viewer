// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useAppFileLoading } from './useAppFileLoading';

const openCruiseFilePicker = vi.fn();
const openSettingsFilePicker = vi.fn();
const clearCruiseFileLoadError = vi.fn();
const clearSettingsFileLoadError = vi.fn();
const clearInitialSettingsFileLoadError = vi.fn();
const setCruiseFileLoadError = vi.fn();
const handleCruiseFileSelect = vi.fn();
const handleSettingsFileSelect = vi.fn();

let cruiseFileLoadError: string | null = null;
let settingsFileLoadError: string | null = null;
let initialSettingsFileLoadError: string | null = null;
let isCruiseFileLoading = false;
let isSettingsFileLoading = false;

vi.mock('../useLoadCruiseResultFromFile', () => ({
  useLoadCruiseResultFromFile: () => ({
    fileInputRef: { current: null },
    openFilePicker: openCruiseFilePicker,
    handleFileSelect: handleCruiseFileSelect,
    isLoading: isCruiseFileLoading,
    fileLoadError: cruiseFileLoadError,
    setFileLoadError: setCruiseFileLoadError,
    clearFileLoadError: clearCruiseFileLoadError,
  }),
}));

vi.mock('../useLoadWorkspaceSettingsFromFile', () => ({
  useLoadWorkspaceSettingsFromFile: () => ({
    fileInputRef: { current: null },
    openFilePicker: openSettingsFilePicker,
    handleFileSelect: handleSettingsFileSelect,
    isLoading: isSettingsFileLoading,
    fileLoadError: settingsFileLoadError,
    clearFileLoadError: clearSettingsFileLoadError,
  }),
}));

vi.mock('../useInitialWorkspaceSettingsFromCli', () => ({
  useInitialWorkspaceSettingsFromCli: () => ({
    fileLoadError: initialSettingsFileLoadError,
    clearFileLoadError: clearInitialSettingsFileLoadError,
  }),
}));

vi.mock('../useCruiseResultFileDrop', () => ({
  useCruiseResultFileDrop: () => ({
    isDraggingFile: false,
    isDropAllowed: false,
  }),
}));

vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: Object.assign(
    (selector: (state: { reset: () => void; syncWorkspaceSettings: () => void }) => unknown) =>
      selector({ reset: vi.fn(), syncWorkspaceSettings: vi.fn() }),
    {
      getState: () => ({ cruiseResult: { modules: [] } }),
    },
  ),
}));

describe('useAppFileLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cruiseFileLoadError = null;
    settingsFileLoadError = null;
    initialSettingsFileLoadError = null;
    isCruiseFileLoading = false;
    isSettingsFileLoading = false;
  });

  it('prefers cruise file load error over settings and CLI errors', () => {
    cruiseFileLoadError = 'cruise error';
    settingsFileLoadError = 'settings error';
    initialSettingsFileLoadError = 'cli error';

    const { result } = renderHook(() => useAppFileLoading({ cruiseWatchEnabled: false, cruiseReady: true }));

    expect(result.current.fileLoadError).toBe('cruise error');
  });

  it('falls back to settings then CLI errors when cruise error is absent', () => {
    settingsFileLoadError = 'settings error';
    initialSettingsFileLoadError = 'cli error';

    const { result, rerender } = renderHook(() => useAppFileLoading({ cruiseWatchEnabled: false, cruiseReady: true }));
    expect(result.current.fileLoadError).toBe('settings error');

    settingsFileLoadError = null;
    rerender();
    expect(result.current.fileLoadError).toBe('cli error');
  });

  it('clears all file load error sources', () => {
    const { result } = renderHook(() => useAppFileLoading({ cruiseWatchEnabled: false, cruiseReady: true }));

    act(() => {
      result.current.clearFileLoadError();
    });

    expect(clearCruiseFileLoadError).toHaveBeenCalled();
    expect(clearSettingsFileLoadError).toHaveBeenCalled();
    expect(clearInitialSettingsFileLoadError).toHaveBeenCalled();
  });

  it('openLoadCruiseResult clears sibling errors and opens the cruise picker', () => {
    const { result } = renderHook(() => useAppFileLoading({ cruiseWatchEnabled: false, cruiseReady: true }));

    act(() => {
      result.current.openLoadCruiseResult();
    });

    expect(clearSettingsFileLoadError).toHaveBeenCalled();
    expect(clearInitialSettingsFileLoadError).toHaveBeenCalled();
    expect(openCruiseFilePicker).toHaveBeenCalled();
  });
});
