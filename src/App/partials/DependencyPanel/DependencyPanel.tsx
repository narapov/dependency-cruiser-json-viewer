import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { getCruiseModules, getCruiseSources, getNodeRelations, isPathInSources } from '@/domain';

import { presenceRecordToPaths, useWorkspaceStore } from '../../stores/workspaceStore';
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
    const sources = getCruiseSources(state.cruiseSnapshot);
    return state.dependenciesPanelPath != null && isPathInSources(state.dependenciesPanelPath, sources)
      ? state.dependenciesPanelPath
      : null;
  });
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);
  const expandedFolderPaths = useWorkspaceStore(state => state.expandedFolderPaths);
  const userEdgeHighlights = useWorkspaceStore(state => state.userEdgeHighlights);
  const onSetUserDependencyHighlight = useWorkspaceStore(state => state.setUserDependencyHighlight);

  const selectedPaths = useMemo(() => presenceRecordToPaths(selectedFilePaths), [selectedFilePaths]);
  const expandedKeys = useMemo(() => presenceRecordToPaths(expandedFolderPaths), [expandedFolderPaths]);
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys]);
  const modules = useMemo(() => getCruiseModules(cruiseSnapshot), [cruiseSnapshot]);

  const relations = useMemo(
    () => (path != null ? getNodeRelations(path, cruiseSnapshot, selectedPaths, expandedFolders) : null),
    [path, cruiseSnapshot, selectedPaths, expandedFolders],
  );

  if (path == null || relations == null) {
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
          modules={modules}
          direction="dependencies"
          userEdgeHighlights={userEdgeHighlights}
          onSetUserDependencyHighlight={onSetUserDependencyHighlight}
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
          modules={modules}
          direction="dependents"
          userEdgeHighlights={userEdgeHighlights}
          onSetUserDependencyHighlight={onSetUserDependencyHighlight}
          onShowInGraph={onShowInGraph}
        />
      </Box>
    </Box>
  );
}
