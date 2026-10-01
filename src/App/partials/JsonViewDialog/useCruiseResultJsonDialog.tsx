import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useJsonDialog } from './useJsonDialog';

/**
 * Opens the full cruise-result JSON dialog, reading data from the workspace store.
 */
export function useCruiseResultJsonDialog(): {
  openViewCruiseResultJson: () => void;
  cruiseResultJsonDialog: ReactNode;
} {
  const { t } = useTranslation();
  const { openJsonDialog, jsonDialog } = useJsonDialog({
    title: t('cruiseResultJson.title'),
    shouldExpandNode: level => level < 4,
    fullScreen: true,
  });

  const openViewCruiseResultJson = () => {
    const cruiseResult = useWorkspaceStore.getState().cruiseResult;
    if (!cruiseResult) {
      return;
    }
    openJsonDialog({ data: cruiseResult });
  };

  return { openViewCruiseResultJson, cruiseResultJsonDialog: jsonDialog };
}
