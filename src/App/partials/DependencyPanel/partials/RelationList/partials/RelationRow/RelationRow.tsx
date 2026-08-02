import type { IModule } from 'dependency-cruiser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRight from '@mui/icons-material/ChevronRight';
import ColorizeOutlined from '@mui/icons-material/ColorizeOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { getBaseName, getEdgeHighlightColor, type ModuleRelation } from '@/domain';
import { copyToClipboard, highlightColorMenuListSx, HighlightColorSwatches } from '@/Shared';

import {
  getPanelRelationDependencyKeys,
  getRelationPathStyle,
  keyPrefixForChild,
  type PanelRelationDirection,
} from '../../helpers';
import { useRelationRowContextMenu } from '../../hooks';

interface RelationRowProps {
  item: ModuleRelation;
  expandKey: string;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  panelPath: string;
  modules: IModule[];
  direction: PanelRelationDirection;
  userEdgeHighlights: ReadonlyMap<string, string>;
  onSetUserDependencyHighlight: (dependencyKeys: readonly string[], color: string | null) => void;
  onShowInGraph: (path: string) => void;
  depth: number;
}

/** One relation row with optional expandable nested children. */
export function RelationRow({
  item,
  expandKey,
  expandedKeys,
  onToggleExpand,
  panelPath,
  modules,
  direction,
  userEdgeHighlights,
  onSetUserDependencyHighlight,
  onShowInGraph,
  depth,
}: RelationRowProps) {
  const { t } = useTranslation();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const expanded = expandedKeys.has(expandKey);
  const highlightEnabled = !hasChildren;
  const dependencyKeys = highlightEnabled
    ? getPanelRelationDependencyKeys(panelPath, item.path, direction, modules)
    : [];
  const currentHighlight = highlightEnabled ? getEdgeHighlightColor(dependencyKeys, userEdgeHighlights) : undefined;

  const handleSetHighlight = (color: string | null) => {
    onSetUserDependencyHighlight(dependencyKeys, color);
  };

  const { onContextMenu, contextMenu } = useRelationRowContextMenu({
    path: item.path,
    onShowInGraph,
    highlightEnabled,
    currentHighlight,
    onSetHighlight: handleSetHighlight,
  });

  const [highlightMenuAnchor, setHighlightMenuAnchor] = useState<HTMLElement | null>(null);

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
        {highlightEnabled && currentHighlight != null ? (
          <Box
            aria-hidden
            sx={{
              width: 12,
              height: 12,
              flexShrink: 0,
              mr: 0.5,
              borderRadius: '2px',
              backgroundColor: currentHighlight,
              border: '1px solid rgba(0, 0, 0, 0.2)',
            }}
          />
        ) : null}
        <ListItemText
          primary={getBaseName(item.path)}
          sx={{ flex: 1, minWidth: 0, m: 0 }}
          slotProps={{
            primary: {
              sx: {
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.3,
                wordBreak: 'break-all',
                ...getRelationPathStyle(item),
              },
            },
          }}
        />
        <Stack className="relationRowActions" direction="row" sx={{ flexShrink: 0, alignItems: 'center' }}>
          {highlightEnabled ? (
            <Tooltip title={t('actions.highlight')}>
              <IconButton
                edge="end"
                size="small"
                aria-label={t('actions.highlight')}
                aria-haspopup="true"
                onClick={event => setHighlightMenuAnchor(event.currentTarget)}
                sx={{ p: 0.25, position: 'relative' }}
              >
                <ColorizeOutlined fontSize="small" />
                {currentHighlight != null ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 2,
                      bottom: 2,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: currentHighlight,
                      border: '1px solid rgba(0, 0, 0, 0.25)',
                    }}
                  />
                ) : null}
              </IconButton>
            </Tooltip>
          ) : null}
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
      {highlightEnabled ? (
        <Menu
          anchorEl={highlightMenuAnchor}
          open={highlightMenuAnchor != null}
          onClose={() => setHighlightMenuAnchor(null)}
          slotProps={{ list: { sx: highlightColorMenuListSx } }}
        >
          <HighlightColorSwatches
            currentHighlight={currentHighlight}
            onSelect={color => {
              setHighlightMenuAnchor(null);
              handleSetHighlight(color);
            }}
          />
        </Menu>
      ) : null}
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
                panelPath={panelPath}
                modules={modules}
                direction={direction}
                userEdgeHighlights={userEdgeHighlights}
                onSetUserDependencyHighlight={onSetUserDependencyHighlight}
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
