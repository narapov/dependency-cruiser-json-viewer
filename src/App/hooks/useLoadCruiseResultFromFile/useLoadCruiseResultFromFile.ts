import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useQueryClient } from '@tanstack/react-query';

import { CruiseResultParseError, parseCruiseResultJson } from '@/domain';
import { raceWithAbortSignal } from '@/Shared';

export function useLoadCruiseResultFromFile() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const fileInputRef = useRef<{ open: () => void }>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
    };
  }, []);

  const openFilePicker = () => {
    setFileLoadError(null);
    fileInputRef.current?.open();
  };

  const handleFileSelect = async (file: File) => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const { signal } = controller;

    try {
      const result = await raceWithAbortSignal(
        file.text().then(text => parseCruiseResultJson(text)),
        signal,
      );
      if (signal.aborted) {
        return;
      }
      queryClient.setQueryData(['cruise-result'], result);
      setFileLoadError(null);
    } catch (error) {
      if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        return;
      }
      if (error instanceof CruiseResultParseError) {
        setFileLoadError(
          error.code === 'invalidJson' ? t('app.invalidCruiseResultJson') : t('app.invalidCruiseResultFormat'),
        );
        return;
      }
      setFileLoadError(t('app.invalidCruiseResultFormat'));
    }
  };

  const clearFileLoadError = () => {
    setFileLoadError(null);
  };

  return {
    fileInputRef,
    openFilePicker,
    handleFileSelect,
    fileLoadError,
    clearFileLoadError,
  };
}
