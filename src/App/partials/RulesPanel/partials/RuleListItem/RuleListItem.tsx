import type { IViolation } from 'dependency-cruiser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRight from '@mui/icons-material/ChevronRight';
import DataObjectOutlined from '@mui/icons-material/DataObjectOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { RuleWithViolations } from '@/domain';
import {
  HighlightedMatchText,
  MatchHighlight,
  RuleSeverityChip,
  RuleViolationsCountChip,
  TextWithFloatingActions,
} from '@/Shared';

import { RuleJsonDialog } from '../../../RuleJsonDialog';
import { findSubstringMatchIndexes } from '../../helpers/findSubstringMatchIndexes';

interface RuleListItemProps {
  entry: RuleWithViolations;
  nameFilter: string;
  onSelectViolationPaths: (paths: string[]) => void;
  onShowRuleViolations: (ruleName: string) => void;
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

export function RuleListItem({ entry, nameFilter, onSelectViolationPaths, onShowRuleViolations }: RuleListItemProps) {
  const { t } = useTranslation();
  const [jsonOpen, setJsonOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const count = entry.violations.length;
  const hasViolations = count > 0;
  const canViewJson = entry.rule != null;
  const nameMatchIndexes = findSubstringMatchIndexes(entry.name, nameFilter);
  const showViolationsLabel = t('rules.showViolationsOnly');

  return (
    <>
      <ListItem
        disableGutters
        title={entry.name}
        sx={{
          display: 'block',
          py: 0.25,
          px: 1,
          borderRadius: 1,
          '&:hover, &:focus-within': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <TextWithFloatingActions
          leading={
            hasViolations ? (
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
            )
          }
          trailing={
            <>
              {hasViolations && (
                <Tooltip title={showViolationsLabel}>
                  <IconButton
                    size="small"
                    aria-label={showViolationsLabel}
                    onClick={() => onShowRuleViolations(entry.name)}
                    sx={{ p: 0.25 }}
                  >
                    <VisibilityOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canViewJson && (
                <Tooltip title={t('rules.viewJson')}>
                  <IconButton
                    size="small"
                    aria-label={t('rules.viewJson')}
                    onClick={() => setJsonOpen(true)}
                    sx={{ p: 0.25 }}
                  >
                    <DataObjectOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          }
        >
          <Typography
            variant="body2"
            component="span"
            sx={{ fontFamily: 'monospace', fontSize: 12, overflowWrap: 'anywhere', mr: 0.75 }}
          >
            <HighlightedMatchText text={entry.name} indexes={nameMatchIndexes} Highlight={MatchHighlight} />
          </Typography>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <RuleSeverityChip severity={entry.severity} />
            <RuleViolationsCountChip count={count} />
          </Box>
        </TextWithFloatingActions>
      </ListItem>
      {hasViolations && (
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
      )}
      {canViewJson && (
        <RuleJsonDialog open={jsonOpen} ruleName={entry.name} rule={entry.rule} onClose={() => setJsonOpen(false)} />
      )}
    </>
  );
}
