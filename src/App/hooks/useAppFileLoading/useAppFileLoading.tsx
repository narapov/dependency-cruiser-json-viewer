import { useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';

import { serializeViewerWorkspace, type ViewerWorkspaceSettings } from '@/domain';

import { CruiseResultDropOverlay } from '../../partials/CruiseResultDropOverlay';
import { CruiseResultFileInput } from '../../partials/CruiseResultFileInput';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useCruiseResultFileDrop } from '../useCruiseResultFileDrop';
import { useInitialWorkspaceSettingsFromCli } from '../useInitialWorkspaceSettingsFromCli';
import { useLoadCruiseResultFromFile, type LoadedCruiseResultFile } from '../useLoadCruiseResultFromFile';
import { useLoadWorkspaceSettingsFromFile } from '../useLoadWorkspaceSettingsFromFile';

import styles from './useAppFileLoading.module.css';

interface UseAppFileLoadingOptions {
  cruiseWatchEnabled: boolean;
  cruiseReady: boolean;
}

/**
 * Composes cruise/settings/CLI file load and drop. Bootstrap uses the action/error
 * API; `overlay` mounts the main-shell file UI (inputs, spinner, drop, error snackbar).
 */
export function useAppFileLoading(config: UseAppFileLoadingOptions) {
  const { cruiseWatchEnabled, cruiseReady } = config;

  const { t } = useTranslation();
  const resetWorkspace = useWorkspaceStore(state => state.reset);
  const syncWorkspaceSettings = useWorkspaceStore(state => state.syncWorkspaceSettings);

  const handleCruiseLoaded = useCallback(
    ({ cruiseResult: loadedCruiseResult, settings }: LoadedCruiseResultFile) => {
      const toReset = settings != null ? serializeViewerWorkspace(loadedCruiseResult, settings) : loadedCruiseResult;
      resetWorkspace(toReset, 'hard');
    },
    [resetWorkspace],
  );

  const handleWorkspaceSettingsLoaded = useCallback(
    (settings: ViewerWorkspaceSettings) => {
      if (useWorkspaceStore.getState().cruiseResult == null) {
        return;
      }
      syncWorkspaceSettings(settings);
    },
    [syncWorkspaceSettings],
  );

  const {
    fileInputRef: cruiseFileInputRef,
    openFilePicker: openCruiseFilePicker,
    handleFileSelect: handleCruiseFileSelect,
    isLoading: isCruiseFileLoading,
    fileLoadError: cruiseFileLoadError,
    setFileLoadError: setCruiseFileLoadError,
    clearFileLoadError: clearCruiseFileLoadError,
  } = useLoadCruiseResultFromFile({ onLoaded: handleCruiseLoaded });

  const {
    fileInputRef: settingsFileInputRef,
    openFilePicker: openSettingsFilePicker,
    handleFileSelect: handleSettingsFileSelect,
    isLoading: isSettingsFileLoading,
    fileLoadError: settingsFileLoadError,
    clearFileLoadError: clearSettingsFileLoadError,
  } = useLoadWorkspaceSettingsFromFile({ onLoaded: handleWorkspaceSettingsLoaded });

  const { fileLoadError: initialSettingsFileLoadError, clearFileLoadError: clearInitialSettingsFileLoadError } =
    useInitialWorkspaceSettingsFromCli({
      cruiseReady,
      onLoaded: handleWorkspaceSettingsLoaded,
    });

  const isFileLoading = isCruiseFileLoading || isSettingsFileLoading;

  const { isDraggingFile, isDropAllowed } = useCruiseResultFileDrop({
    enabled: !cruiseWatchEnabled && !isFileLoading,
    onFile: file => {
      clearSettingsFileLoadError();
      clearInitialSettingsFileLoadError();
      clearCruiseFileLoadError();
      void handleCruiseFileSelect(file);
    },
    onInvalidFile: () => {
      clearSettingsFileLoadError();
      clearInitialSettingsFileLoadError();
      setCruiseFileLoadError(t('app.dropCruiseResultInvalidFile'));
    },
  });

  const openLoadCruiseResult = () => {
    if (cruiseWatchEnabled || isFileLoading) {
      return;
    }
    clearSettingsFileLoadError();
    clearInitialSettingsFileLoadError();
    openCruiseFilePicker();
  };

  const openLoadSettings = () => {
    if (isFileLoading) {
      return;
    }
    clearCruiseFileLoadError();
    clearInitialSettingsFileLoadError();
    openSettingsFilePicker();
  };

  const fileLoadError = cruiseFileLoadError ?? settingsFileLoadError ?? initialSettingsFileLoadError;
  const clearFileLoadError = () => {
    clearCruiseFileLoadError();
    clearSettingsFileLoadError();
    clearInitialSettingsFileLoadError();
  };

  const overlay: ReactNode = (
    <>
      {!cruiseWatchEnabled && <CruiseResultFileInput ref={cruiseFileInputRef} onFileSelect={handleCruiseFileSelect} />}
      <CruiseResultFileInput ref={settingsFileInputRef} onFileSelect={handleSettingsFileSelect} />
      {isFileLoading && (
        <div className={styles.fileLoadOverlay}>
          <CircularProgress size={32} />
        </div>
      )}
      <CruiseResultDropOverlay open={isDraggingFile} allowed={isDropAllowed} />
      <Snackbar
        open={Boolean(fileLoadError)}
        autoHideDuration={6000}
        onClose={clearFileLoadError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearFileLoadError} sx={{ width: '100%' }}>
          {fileLoadError}
        </Alert>
      </Snackbar>
    </>
  );

  return {
    openLoadCruiseResult,
    openLoadSettings,
    isFileLoading,
    fileLoadError,
    clearFileLoadError,
    isDraggingFile,
    isDropAllowed,
    cruiseFileInputRef,
    handleCruiseFileSelect,
    overlay,
  };
}
