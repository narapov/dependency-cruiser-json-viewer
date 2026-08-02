import { useState } from 'react';
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
import Typography from '@mui/material/Typography';

import { getBaseName, type ModuleRelation } from '@/domain';
import { copyToClipboard } from '@/Shared';

import { countRelationLeaves, getRelationPathStyle } from './helpers';
import { useRelationRowContextMenu } from './hooks';

interface RelationListProps {
  items: ModuleRelation[];
  hiddenItems?: ModuleRelation[];
  onShowInGraph: (path: string) => void;
}

/** Recursively collect expand keys for every group that has children. */
function collectExpandedKeys(items: ModuleRelation[], keyPrefix: string, into: Set<string>): void {
  items.forEach(item => {
    if ((item.children?.length ?? 0) > 0) {
      const key = `${keyPrefix}${item.path}`;
      into.add(key);
      collectExpandedKeys(item.children!, keyPrefix, into);
    }
  });
}

/** Collect expand keys for every group that has children. */
function initialExpandedKeys(items: ModuleRelation[], keyPrefix: string): Set<string> {
  const keys = new Set<string>();
  collectExpandedKeys(items, keyPrefix, keys);
  return keys;
}

/** Toggle whether a key is present in an expanded-key set. */
function toggleExpandedKey(prev: Set<string>, key: string): Set<string> {
  const next = new Set(prev);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}

interface RelationRowProps {
  item: ModuleRelation;
  expandKey: string;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  onShowInGraph: (path: string) => void;
  depth: number;
}

/** One relation row with optional expandable nested children. */
function RelationRow({ item, expandKey, expandedKeys, onToggleExpand, onShowInGraph, depth }: RelationRowProps) {
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

/** Build a stable expand key for a nested child under its parent key prefix. */
function keyPrefixForChild(parentExpandKey: string, childPath: string): string {
  if (parentExpandKey.startsWith('hidden:')) {
    return `hidden:${childPath}`;
  }
  return childPath;
}

export function RelationList({ items, hiddenItems = [], onShowInGraph }: RelationListProps) {
  const { t } = useTranslation();
  const [expandedKeys, setExpandedKeys] = useState(() => initialExpandedKeys(items, ''));
  const [hiddenExpandedKeys, setHiddenExpandedKeys] = useState(() => initialExpandedKeys(hiddenItems, 'hidden:'));
  const [hiddenSectionOpen, setHiddenSectionOpen] = useState(false);

  const hiddenCount = countRelationLeaves(hiddenItems);
  const isEmpty = items.length === 0 && hiddenItems.length === 0;

  if (isEmpty) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        {t('dependencyPanel.noDependencies')}
      </Typography>
    );
  }

  return (
    <Box>
      {items.length > 0 ? (
        <List dense disablePadding>
          {items.map(item => {
            const expandKey = item.path;
            return (
              <RelationRow
                key={item.path}
                item={item}
                expandKey={expandKey}
                expandedKeys={expandedKeys}
                onToggleExpand={key => setExpandedKeys(prev => toggleExpandedKey(prev, key))}
                onShowInGraph={onShowInGraph}
                depth={0}
              />
            );
          })}
        </List>
      ) : null}

      {hiddenCount > 0 ? (
        <Box sx={{ mt: items.length > 0 ? 0.5 : 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              py: 0.25,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => setHiddenSectionOpen(open => !open)}
            role="button"
            aria-expanded={hiddenSectionOpen}
            aria-label={hiddenSectionOpen ? t('actions.collapse') : t('actions.expand')}
          >
            <Typography component="span" variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
              {t('dependencyPanel.hidden', { count: hiddenCount })}
            </Typography>
            <IconButton size="small" aria-hidden tabIndex={-1} sx={{ width: 24, height: 24, pointerEvents: 'none' }}>
              {hiddenSectionOpen ? <ExpandMore sx={{ fontSize: 16 }} /> : <ChevronRight sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
          <Collapse in={hiddenSectionOpen} unmountOnExit>
            <List dense disablePadding>
              {hiddenItems.map(item => {
                const expandKey = `hidden:${item.path}`;
                return (
                  <RelationRow
                    key={expandKey}
                    item={item}
                    expandKey={expandKey}
                    expandedKeys={hiddenExpandedKeys}
                    onToggleExpand={key => setHiddenExpandedKeys(prev => toggleExpandedKey(prev, key))}
                    onShowInGraph={onShowInGraph}
                    depth={0}
                  />
                );
              })}
            </List>
          </Collapse>
        </Box>
      ) : null}
    </Box>
  );
}
