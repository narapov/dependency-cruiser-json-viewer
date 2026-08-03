import type { ICruiseResult } from 'dependency-cruiser';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useQueryClient } from '@tanstack/react-query';

import type { ViewerWorkspaceSettings } from '@/domain';

import { isViewerFileLoadAbort, readViewerFile, resolveViewerFileParseErrorMessage } from '../../helpers';
import { useFileLoadNotice } from '../useFileLoadNotice';

export interface LoadedCruiseResultFile {
  cruiseResult: ICruiseResult;
  settings?: ViewerWorkspaceSettings;
}

interface UseLoadCruiseResultFromFileOptions {
  onLoaded?: (loaded: LoadedCruiseResultFile) => void;
}

export function useLoadCruiseResultFromFile(options: UseLoadCruiseResultFromFileOptions = {}) {
  const { onLoaded } = options;
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const fileInputRef = useRef<{ open: () => void }>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { fileLoadError, setFileLoadError, clearFileLoadError } = useFileLoadNotice();

  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
    };
  }, []);

  const openFilePicker = () => {
    clearFileLoadError();
    fileInputRef.current?.open();
  };

  const handleFileSelect = async (file: File) => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const { signal } = controller;
    setIsLoading(true);

    try {
      const parsed = await readViewerFile(file, signal);
      if (signal.aborted) {
        return;
      }

      queryClient.setQueryData(['cruise-result'], parsed.cruiseResult);
      onLoaded?.({ cruiseResult: parsed.cruiseResult, settings: parsed.settings });
      if (parsed.workspaceSettingsIgnored) {
        setFileLoadError(t('app.ignoredInvalidWorkspaceSettings'));
      } else {
        clearFileLoadError();
      }
    } catch (error) {
      if (isViewerFileLoadAbort(error, signal)) {
        return;
      }
      console.error(error);
      setFileLoadError(resolveViewerFileParseErrorMessage(error, t));
    } finally {
      if (loadAbortRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  return {
    fileInputRef,
    openFilePicker,
    handleFileSelect,
    isLoading,
    fileLoadError,
    clearFileLoadError,
  };
}
