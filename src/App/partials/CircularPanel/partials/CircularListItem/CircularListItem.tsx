import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRight from '@mui/icons-material/ChevronRight';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { getBaseName } from '@/domain';
import { copyToClipboard } from '@/Shared';

interface CircularListItemProps {
  paths: string[];
  onShowCycle: (paths: string[]) => void;
  onShowInGraph: (path: string) => void;
}

function formatCycleLabel(paths: string[]): string {
  return paths.map(getBaseName).join(' → ');
}

const circularRowActionsHoverSx = {
  '& .circularRowActions': {
    opacity: 0,
    pointerEvents: 'none',
  },
  '&:hover .circularRowActions, &:focus-within .circularRowActions': {
    opacity: 1,
    pointerEvents: 'auto',
  },
} as const;

export function CircularListItem({ paths, onShowCycle, onShowInGraph }: CircularListItemProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const label = formatCycleLabel(paths);
  const fullPaths = paths.join(' → ');
  const showLabel = t('circular.showCycle');
  const expandLabel = expanded ? t('actions.collapse') : t('actions.expand');

  return (
    <>
      <ListItem
        disableGutters
        title={fullPaths}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          py: 0.5,
          px: 1,
          borderRadius: 1,
          '&:hover, &:focus-within': {
            bgcolor: 'action.hover',
          },
          ...circularRowActionsHoverSx,
        }}
      >
        <IconButton
          size="small"
          aria-label={expandLabel}
          onClick={() => setExpanded(open => !open)}
          sx={{ flexShrink: 0, p: 0.25 }}
        >
          {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
        </IconButton>
        <ListItemText
          primary={
            <Typography variant="body2" noWrap>
              {label}
            </Typography>
          }
          sx={{ my: 0, flex: 1, minWidth: 0 }}
        />
        <Stack className="circularRowActions" direction="row" sx={{ flexShrink: 0, alignItems: 'center' }}>
          <Tooltip title={showLabel}>
            <IconButton
              edge="end"
              size="small"
              aria-label={showLabel}
              onClick={() => onShowCycle(paths)}
              sx={{ p: 0.25 }}
            >
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List dense disablePadding sx={{ pl: 4, pb: 0.5 }}>
          {paths.map(path => (
            <ListItem
              key={path}
              disableGutters
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                py: 0.25,
                px: 1,
                borderRadius: 1,
                '&:hover, &:focus-within': {
                  bgcolor: 'action.hover',
                },
                ...circularRowActionsHoverSx,
              }}
            >
              <ListItemText
                primary={path}
                sx={{ my: 0, flex: 1, minWidth: 0 }}
                slotProps={{
                  primary: {
                    sx: {
                      fontFamily: 'monospace',
                      fontSize: 12,
                      lineHeight: 1.3,
                      wordBreak: 'break-all',
                    },
                  },
                }}
              />
              <Stack className="circularRowActions" direction="row" sx={{ flexShrink: 0, alignItems: 'center' }}>
                <Tooltip title={t('actions.copyPath')}>
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={t('actions.copyPath')}
                    onClick={() => void copyToClipboard(path)}
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
                    onClick={() => onShowInGraph(path)}
                    sx={{ p: 0.25 }}
                  >
                    <MyLocationOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
}
