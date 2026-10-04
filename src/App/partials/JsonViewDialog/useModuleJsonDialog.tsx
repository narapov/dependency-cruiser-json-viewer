import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { getCruiseModules } from '@/domain';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useJsonDialog } from './useJsonDialog';

/**
 * Opens module JSON via `useJsonDialog`, resolving path → data from the workspace cruise snapshot.
 */
export function useModuleJsonDialog(): {
  openModuleJson: (path: string) => void;
  moduleJsonDialog: ReactNode;
} {
  const { t } = useTranslation();
  const { openJsonDialog, jsonDialog } = useJsonDialog({ maxWidth: 'md' });

  const openModuleJson = (path: string) => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const node = cruiseSnapshot.nodes.get(path);
    if (!node) {
      return;
    }

    const data = node.isFolder ? getCruiseModules(cruiseSnapshot, [...node.descendantFiles]) : node.originModule;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return;
    }

    openJsonDialog({ title: t('moduleJson.title', { path }), data });
  };

  return { openModuleJson, moduleJsonDialog: jsonDialog };
}
