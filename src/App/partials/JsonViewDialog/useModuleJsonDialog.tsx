import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { getModuleJsonData } from '@/domain';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useJsonDialog } from './useJsonDialog';

/**
 * Opens module JSON via `useJsonDialog`, resolving path → data from the workspace cruise result.
 */
export function useModuleJsonDialog(): {
  openModuleJson: (path: string) => void;
  moduleJsonDialog: ReactNode;
} {
  const { t } = useTranslation();
  const { openJsonDialog, jsonDialog } = useJsonDialog({ maxWidth: 'md' });

  const openModuleJson = (path: string) => {
    const modules = useWorkspaceStore.getState().cruiseResult?.modules ?? [];
    const data = getModuleJsonData(path, modules);
    if (data == null) {
      return;
    }
    openJsonDialog({ title: t('moduleJson.title', { path }), data });
  };

  return { openModuleJson, moduleJsonDialog: jsonDialog };
}
