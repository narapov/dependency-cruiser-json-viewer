import type { IModule } from 'dependency-cruiser';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { getModuleJsonData } from '@/domain';

import { JsonViewDialog } from '../../partials/JsonViewDialog';

export function useModuleJsonDialog(allModules: readonly IModule[]): {
  openModuleJson: (path: string) => void;
  moduleJsonDialog: ReactNode;
} {
  const { t } = useTranslation();
  const [path, setPath] = useState<string | null>(null);

  const jsonData = path != null ? getModuleJsonData(path, allModules) : null;

  const openModuleJson = (nextPath: string) => {
    if (getModuleJsonData(nextPath, allModules) == null) {
      return;
    }
    setPath(nextPath);
  };

  const moduleJsonDialog = (
    <JsonViewDialog
      open={path != null && jsonData != null}
      title={t('moduleJson.title', { path: path ?? '' })}
      data={jsonData}
      onClose={() => setPath(null)}
      maxWidth="md"
    />
  );

  return { openModuleJson, moduleJsonDialog };
}
