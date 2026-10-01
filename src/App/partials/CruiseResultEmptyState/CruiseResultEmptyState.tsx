import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { CruiseResultParseError } from '@/domain';

import { CruiseResultDropOverlay } from '../CruiseResultDropOverlay';
import { CruiseResultFileInput, type CruiseResultFileInputHandle } from '../CruiseResultFileInput';

import styles from './CruiseResultEmptyState.module.css';

export interface CruiseResultEmptyStateProps {
  error: unknown;
  cruiseWatchEnabled: boolean;
  isFileLoading: boolean;
  fileLoadError: string | null;
  isDraggingFile: boolean;
  isDropAllowed: boolean;
  onLoadCruiseResult: () => void;
  cruiseFileInputRef: RefObject<CruiseResultFileInputHandle | null>;
  onCruiseFileSelect: (file: File) => void;
}

/**
 * Full-screen empty / parse-error screen when no cruise result is available for the shell.
 */
export function CruiseResultEmptyState(props: CruiseResultEmptyStateProps) {
  const {
    error,
    cruiseWatchEnabled,
    isFileLoading,
    fileLoadError,
    isDraggingFile,
    isDropAllowed,
    onLoadCruiseResult,
    cruiseFileInputRef,
    onCruiseFileSelect,
  } = props;

  const { t } = useTranslation();
  const apiParseError = error instanceof CruiseResultParseError ? t('app.invalidCruiseResultFormat') : null;

  return (
    <div className={styles.centered}>
      <Stack spacing={2} sx={{ maxWidth: 480, px: 2, alignItems: 'center' }}>
        {apiParseError ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {apiParseError}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ width: '100%' }}>
            <AlertTitle>{t('app.noCruiseResultTitle')}</AlertTitle>
            {t('app.noCruiseResultMessage')}
          </Alert>
        )}
        {fileLoadError && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {fileLoadError}
          </Alert>
        )}
        {!cruiseWatchEnabled &&
          (isFileLoading ? (
            <CircularProgress size={32} />
          ) : (
            <Button variant="contained" onClick={onLoadCruiseResult} disabled={isFileLoading}>
              {t('app.loadCruiseResult')}
            </Button>
          ))}
        {!cruiseWatchEnabled && <CruiseResultFileInput ref={cruiseFileInputRef} onFileSelect={onCruiseFileSelect} />}
      </Stack>
      <CruiseResultDropOverlay open={isDraggingFile} allowed={isDropAllowed} />
    </div>
  );
}
