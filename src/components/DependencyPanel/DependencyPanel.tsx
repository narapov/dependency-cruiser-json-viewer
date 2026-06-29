import type { IModule } from 'dependency-cruiser';
import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { getNodeRelations, type ModuleRelation } from '../../domain';
import { CIRCULAR_EDGE_COLOR, copyToClipboard, TYPE_ONLY_CIRCULAR_EDGE_COLOR } from '../../Shared';

interface DependencyPanelProps {
  path: string;
  modules: IModule[];
  selectedPaths: string[];
  expandedKeys: string[];
  onClose: () => void;
  onShowInGraph: (path: string) => void;
}

function getRelationPathStyle(item: ModuleRelation): CSSProperties {
  if (item.circular) {
    return { color: CIRCULAR_EDGE_COLOR };
  }
  if (item.typeOnlyCircular) {
    return { color: TYPE_ONLY_CIRCULAR_EDGE_COLOR };
  }
  if (item.typeOnly) {
    return { textDecoration: 'underline dashed' };
  }
  return {};
}

function RelationList({ items, onShowInGraph }: { items: ModuleRelation[]; onShowInGraph: (path: string) => void }) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        {t('dependencyPanel.noDependencies')}
      </Typography>
    );
  }

  return (
    <List dense disablePadding>
      {items.map(item => (
        <ListItem key={item.path} disableGutters sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, py: 0.5 }}>
          <ListItemText
            primary={item.path}
            sx={{ flex: 1, minWidth: 0, m: 0 }}
            slotProps={{
              primary: {
                sx: {
                  fontFamily: 'monospace',
                  fontSize: 11,
                  wordBreak: 'break-all',
                  ...getRelationPathStyle(item),
                },
              },
            }}
          />
          <Stack direction="row" sx={{ flexShrink: 0 }}>
            <Tooltip title={t('actions.copyPath')}>
              <IconButton edge="end" aria-label={t('actions.copyPath')} onClick={() => void copyToClipboard(item.path)}>
                <ContentCopyOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('actions.showInGraph')}>
              <IconButton edge="end" aria-label={t('actions.showInGraph')} onClick={() => onShowInGraph(item.path)}>
                <MyLocationOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </ListItem>
      ))}
    </List>
  );
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
      <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, flexShrink: 0, alignItems: 'flex-start' }}>
        <Typography
          component="div"
          sx={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {path}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Tooltip title={t('actions.showInGraph')}>
            <IconButton color="primary" aria-label={t('actions.showInGraph')} onClick={() => onShowInGraph(path)}>
              <MyLocationOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.close')}>
            <IconButton aria-label={t('actions.close')} onClick={onClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
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
