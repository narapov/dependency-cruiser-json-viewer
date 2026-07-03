import { useTranslation } from 'react-i18next';

import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { ModuleRelation } from '@/domain';
import { copyToClipboard } from '@/Shared';

import { getRelationPathStyle } from './helpers';

interface RelationListProps {
  items: ModuleRelation[];
  onShowInGraph: (path: string) => void;
}

export function RelationList({ items, onShowInGraph }: RelationListProps) {
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
