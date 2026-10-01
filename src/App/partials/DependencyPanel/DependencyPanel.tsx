import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { getNodeRelations } from '@/domain';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { DependencyPanelHeader } from './partials/DependencyPanelHeader';
import { RelationList } from './partials/RelationList';

interface DependencyPanelProps {
  onClose: () => void;
  onShowInGraph: (path: string) => void;
  onViewModuleJson: (path: string) => void;
}

export function DependencyPanel(props: DependencyPanelProps) {
  const { onClose, onShowInGraph, onViewModuleJson } = props;

  const { t } = useTranslation();
  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const path = useWorkspaceStore(state => {
    const panelPath = state.dependenciesPanelPath;
    return panelPath && state.cruiseSnapshot.nodes.has(panelPath) ? panelPath : null;
  });
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);

  const relations = path ? getNodeRelations(path, cruiseSnapshot, selectedFilePaths) : null;

  if (!path || !relations) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <DependencyPanelHeader
        path={path}
        onClose={onClose}
        onShowInGraph={onShowInGraph}
        onViewModuleJson={onViewModuleJson}
      />
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('dependencyPanel.dependencies')}
        </Typography>
        <RelationList
          key={`${path}-dependencies`}
          items={relations.dependencies}
          hiddenItems={relations.hiddenDependencies}
          panelPath={path}
          direction="dependencies"
          onShowInGraph={onShowInGraph}
        />

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          {t('dependencyPanel.dependents')}
        </Typography>
        <RelationList
          key={`${path}-dependents`}
          items={relations.dependents}
          hiddenItems={relations.hiddenDependents}
          panelPath={path}
          direction="dependents"
          onShowInGraph={onShowInGraph}
        />
      </Box>
    </Box>
  );
}
