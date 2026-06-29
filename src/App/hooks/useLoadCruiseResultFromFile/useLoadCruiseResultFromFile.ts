import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useQueryClient } from '@tanstack/react-query';

import { CruiseResultParseError, parseCruiseResultJson } from '../../../domain';

export function useLoadCruiseResultFromFile() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const fileInputRef = useRef<{ open: () => void }>(null);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  const openFilePicker = () => {
    setFileLoadError(null);
    fileInputRef.current?.open();
  };

  const handleFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      const result = parseCruiseResultJson(text);
      queryClient.setQueryData(['cruise-result'], result);
      setFileLoadError(null);
    } catch (error) {
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
