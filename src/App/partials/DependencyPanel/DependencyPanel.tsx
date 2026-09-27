import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { getCruiseModules, getNodeRelations } from '@/domain';

import { useCruiseSnapshotRequired } from '../../contexts';
import { DependencyPanelHeader } from './partials/DependencyPanelHeader';
import { RelationList } from './partials/RelationList';

interface DependencyPanelProps {
  path: string;
  selectedPaths: string[];
  expandedKeys: string[];
  onClose: () => void;
  onShowInGraph: (path: string) => void;
  onViewModuleJson: (path: string) => void;
  userEdgeHighlights: ReadonlyMap<string, string>;
  onSetUserDependencyHighlight: (dependencyKeys: readonly string[], color: string | null) => void;
}

export function DependencyPanel(props: DependencyPanelProps) {
  const {
    path,
    selectedPaths,
    expandedKeys,
    onClose,
    onShowInGraph,
    onViewModuleJson,
    userEdgeHighlights,
    onSetUserDependencyHighlight,
  } = props;

  const { t } = useTranslation();
  const cruiseSnapshot = useCruiseSnapshotRequired();
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys]);
  const modules = useMemo(() => getCruiseModules(cruiseSnapshot), [cruiseSnapshot]);

  const relations = useMemo(
    () => getNodeRelations(path, cruiseSnapshot, selectedPaths, expandedFolders),
    [path, cruiseSnapshot, selectedPaths, expandedFolders],
  );

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
