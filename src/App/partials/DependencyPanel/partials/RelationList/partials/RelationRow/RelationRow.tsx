import { useTranslation } from 'react-i18next';

import ChevronRight from '@mui/icons-material/ChevronRight';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { getBaseName, type ModuleRelation } from '@/domain';
import { copyToClipboard } from '@/Shared';

import { getRelationPathStyle, keyPrefixForChild } from '../../helpers';
import { useRelationRowContextMenu } from '../../hooks';

interface RelationRowProps {
  item: ModuleRelation;
  expandKey: string;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  onShowInGraph: (path: string) => void;
  depth: number;
}

/** One relation row with optional expandable nested children. */
export function RelationRow({ item, expandKey, expandedKeys, onToggleExpand, onShowInGraph, depth }: RelationRowProps) {
  const { t } = useTranslation();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const expanded = expandedKeys.has(expandKey);
  const { onContextMenu, contextMenu } = useRelationRowContextMenu({
    path: item.path,
    onShowInGraph,
  });

  return (
    <>
      <ListItem
        disableGutters
        title={item.path}
        onContextMenu={onContextMenu}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          py: 0,
          pl: depth * 0.75,
          borderRadius: 1,
          '&:hover, &:focus-within': {
            bgcolor: 'action.hover',
          },
          '& .relationRowActions': {
            opacity: 0,
            pointerEvents: 'none',
          },
          '&:hover .relationRowActions, &:focus-within .relationRowActions': {
            opacity: 1,
            pointerEvents: 'auto',
          },
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            aria-label={expanded ? t('actions.collapse') : t('actions.expand')}
            onClick={() => onToggleExpand(expandKey)}
            sx={{ flexShrink: 0, p: 0.25 }}
          >
            {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 24, flexShrink: 0 }} />
        )}
        <ListItemText
          primary={getBaseName(item.path)}
          sx={{ flex: 1, minWidth: 0, m: 0 }}
          slotProps={{
            primary: {
              sx: {
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: 1.3,
                wordBreak: 'break-all',
                ...getRelationPathStyle(item),
              },
            },
          }}
        />
        <Stack className="relationRowActions" direction="row" sx={{ flexShrink: 0, alignItems: 'center' }}>
          <Tooltip title={t('actions.copyPath')}>
            <IconButton
              edge="end"
              size="small"
              aria-label={t('actions.copyPath')}
              onClick={() => void copyToClipboard(item.path)}
              sx={{ p: 0.25 }}
            >
              <ContentCopyOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.showInGraph')}>
            <IconButton
              edge="end"
              size="small"
              aria-label={t('actions.showInGraph')}
              onClick={() => onShowInGraph(item.path)}
              sx={{ p: 0.25 }}
            >
              <MyLocationOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </ListItem>
      {contextMenu}
      {hasChildren ? (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List dense disablePadding>
            {item.children!.map(child => (
              <RelationRow
                key={child.path}
                item={child}
                expandKey={`${keyPrefixForChild(expandKey, child.path)}`}
                expandedKeys={expandedKeys}
                onToggleExpand={onToggleExpand}
                onShowInGraph={onShowInGraph}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      ) : null}
    </>
  );
}
