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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { getBaseName } from '@/domain';
import { copyToClipboard, TextWithFloatingActions } from '@/Shared';

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

export function CircularListItem(props: CircularListItemProps) {
  const { paths, onShowCycle, onShowInGraph } = props;

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
          display: 'block',
          py: 0.5,
          px: 1,
          borderRadius: 1,
          '&:hover, &:focus-within': {
            bgcolor: 'action.hover',
          },
          ...circularRowActionsHoverSx,
        }}
      >
        <TextWithFloatingActions
          leading={
            <IconButton
              size="small"
              aria-label={expandLabel}
              onClick={() => setExpanded(open => !open)}
              sx={{ flexShrink: 0, p: 0.25 }}
            >
              {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
          }
          trailingClassName="circularRowActions"
          trailing={
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
          }
        >
          <Typography variant="body2" noWrap>
            {label}
          </Typography>
        </TextWithFloatingActions>
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List dense disablePadding sx={{ pl: 4, pb: 0.5 }}>
          {paths.map(path => (
            <ListItem
              key={path}
              disableGutters
              sx={{
                display: 'block',
                py: 0.25,
                px: 1,
                borderRadius: 1,
                '&:hover, &:focus-within': {
                  bgcolor: 'action.hover',
                },
                ...circularRowActionsHoverSx,
              }}
            >
              <TextWithFloatingActions
                trailingClassName="circularRowActions"
                trailing={
                  <>
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
                  </>
                }
              >
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    lineHeight: 1.3,
                    wordBreak: 'break-all',
                  }}
                >
                  {path}
                </Typography>
              </TextWithFloatingActions>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
}
