import type { IModule } from 'dependency-cruiser';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { getNodeRelations } from '@/domain';

import { DependencyPanelHeader } from './partials/DependencyPanelHeader';
import { RelationList } from './partials/RelationList';

interface DependencyPanelProps {
  path: string;
  modules: IModule[];
  selectedPaths: string[];
  expandedKeys: string[];
  onClose: () => void;
  onShowInGraph: (path: string) => void;
}

export function DependencyPanel({
  path,
  modules,
  selectedPaths,
  expandedKeys,
  onClose,
  onShowInGraph,
}: DependencyPanelProps) {
  const { t } = useTranslation();
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys]);

  const relations = useMemo(
    () => getNodeRelations(path, modules, selectedPaths, expandedFolders),
    [path, modules, selectedPaths, expandedFolders],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <DependencyPanelHeader path={path} onClose={onClose} onShowInGraph={onShowInGraph} />
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('dependencyPanel.dependencies')}
        </Typography>
        <RelationList items={relations.dependencies} onShowInGraph={onShowInGraph} />

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          {t('dependencyPanel.dependents')}
        </Typography>
        <RelationList items={relations.dependents} onShowInGraph={onShowInGraph} />
      </Box>
    </Box>
  );
}
