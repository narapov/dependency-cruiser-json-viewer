import type { IViolation, SeverityType } from 'dependency-cruiser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRight from '@mui/icons-material/ChevronRight';
import DataObjectOutlined from '@mui/icons-material/DataObjectOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { RuleWithViolations } from '@/domain';
import { HighlightedMatchText, MatchHighlight } from '@/Shared';

import { findSubstringMatchIndexes } from '../../helpers/findSubstringMatchIndexes';
import { RuleJsonDialog } from '../RuleJsonDialog';

interface RuleListItemProps {
  entry: RuleWithViolations;
  nameFilter: string;
  onSelectViolationPaths: (paths: string[]) => void;
}

function severityColor(severity: SeverityType): 'error' | 'warning' | 'info' | 'default' {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
}

function formatViolationLabel(violation: IViolation): string {
  if (violation.to && violation.to !== violation.from) {
    return `${violation.from} → ${violation.to}`;
  }
  return violation.from;
}

function violationPaths(violation: IViolation): string[] {
  if (violation.to && violation.to !== violation.from) {
    return [violation.from, violation.to];
  }
  return [violation.from];
}

export function RuleListItem({ entry, nameFilter, onSelectViolationPaths }: RuleListItemProps) {
  const { t } = useTranslation();
  const [jsonOpen, setJsonOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const count = entry.violations.length;
  const hasViolations = count > 0;
  const canViewJson = entry.rule != null;
  const nameMatchIndexes = findSubstringMatchIndexes(entry.name, nameFilter);

  return (
    <>
      <ListItem
        disableGutters
        title={entry.name}
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
        }}
      >
        {hasViolations ? (
          <IconButton
            size="small"
            aria-label={expanded ? t('actions.collapse') : t('actions.expand')}
            onClick={() => setExpanded(open => !open)}
            sx={{ flexShrink: 0, p: 0.25 }}
          >
            {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 24, flexShrink: 0 }} />
        )}
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            <HighlightedMatchText text={entry.name} indexes={nameMatchIndexes} Highlight={MatchHighlight} />
          </Typography>
          <Chip
            size="small"
            label={t(`rules.severity.${entry.severity}`)}
            color={severityColor(entry.severity)}
            variant="outlined"
            sx={{ height: 20, fontSize: 10, flexShrink: 0 }}
          />
          {hasViolations ? (
            <Chip
              size="small"
              label={t('rules.violationsCount', { count })}
              color="error"
              sx={{ height: 20, fontSize: 11, flexShrink: 0 }}
            />
          ) : null}
        </Stack>
        {canViewJson ? (
          <Tooltip title={t('rules.viewJson')}>
            <IconButton
              size="small"
              aria-label={t('rules.viewJson')}
              onClick={() => setJsonOpen(true)}
              sx={{ p: 0.25, flexShrink: 0 }}
            >
              <DataObjectOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </ListItem>
      {hasViolations ? (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List dense disablePadding sx={{ pl: 4, pb: 0.5 }}>
            {entry.violations.map(violation => {
              const label = formatViolationLabel(violation);
              return (
                <ListItemButton
                  key={`${violation.rule.name}:${violation.from}:${violation.to}`}
                  onClick={() => onSelectViolationPaths(violationPaths(violation))}
                  sx={{ borderRadius: 1, py: 0.25, px: 1 }}
                >
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontFamily: 'monospace',
                          fontSize: 11,
                          lineHeight: 1.3,
                          wordBreak: 'break-all',
                        },
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      ) : null}
      {canViewJson ? (
        <RuleJsonDialog open={jsonOpen} ruleName={entry.name} rule={entry.rule} onClose={() => setJsonOpen(false)} />
      ) : null}
    </>
  );
}
