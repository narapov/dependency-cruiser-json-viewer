import { useEffect, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useQuery } from '@tanstack/react-query';

import type { ViewerWorkspaceSettings } from '@/domain';
import { getWindowEnvs } from '@/Shared';

import { fetchWorkspaceSettingsFile } from '../../api/workspaceSettings';
import { resolveViewerFileParseErrorMessage } from '../../helpers';
import { useFileLoadNotice } from '../useFileLoadNotice';

interface UseInitialWorkspaceSettingsFromCliOptions {
  cruiseReady: boolean;
  onLoaded: (settings: ViewerWorkspaceSettings) => void;
}

/** Apply CLI `--workspace-settings` once after the cruise result is available. */
export function useInitialWorkspaceSettingsFromCli(config: UseInitialWorkspaceSettingsFromCliOptions) {
  const { cruiseReady, onLoaded } = config;

  const { t } = useTranslation();
  const { fileLoadError, setFileLoadError, clearFileLoadError } = useFileLoadNotice();
  const enabled = cruiseReady && getWindowEnvs()?.initialWorkspaceSettings === true;

  const { data, error, isSuccess, isError } = useQuery({
    queryKey: ['initial-workspace-settings'],
    queryFn: ({ signal }) => fetchWorkspaceSettingsFile(signal),
    enabled,
    staleTime: Infinity,
    retry: false,
  });

  const applyLoaded = useEffectEvent((settings: ViewerWorkspaceSettings) => {
    onLoaded(settings);
    clearFileLoadError();
  });

  const applyMissing = useEffectEvent(() => {
    setFileLoadError(t('app.missingWorkspaceSettings'));
  });

  const applyError = useEffectEvent((err: unknown) => {
    console.error(err);
    setFileLoadError(resolveViewerFileParseErrorMessage(err, t));
  });

  useEffect(() => {
    if (!isSuccess || data == null) {
      return;
    }
    if (data.settings == null) {
      applyMissing();
      return;
    }
    applyLoaded(data.settings);
  }, [isSuccess, data]);

  useEffect(() => {
    if (!isError) {
      return;
    }
    applyError(error);
  }, [isError, error]);

  return {
    fileLoadError,
    clearFileLoadError,
  };
}
