import type { IViolation, SeverityType } from 'dependency-cruiser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import DataObjectOutlined from '@mui/icons-material/DataObjectOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { RuleWithViolations } from '@/domain';

import { RuleJsonDialog } from '../RuleJsonDialog';

interface RuleListItemProps {
  entry: RuleWithViolations;
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

export function RuleListItem({ entry, onSelectViolationPaths }: RuleListItemProps) {
  const { t } = useTranslation();
  const [jsonOpen, setJsonOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const count = entry.violations.length;
  const hasViolations = count > 0;
  const canViewJson = entry.rule != null;

  return (
    <>
      <Accordion
        disableGutters
        elevation={0}
        square
        expanded={hasViolations ? expanded : false}
        onChange={(_event, nextExpanded) => {
          if (hasViolations) {
            setExpanded(nextExpanded);
          }
        }}
        sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}
      >
        <AccordionSummary
          expandIcon={hasViolations ? <ExpandMoreIcon fontSize="small" /> : null}
          sx={{
            minHeight: 36,
            px: 1,
            flexDirection: 'row-reverse',
            cursor: hasViolations ? undefined : 'default',
            '&:hover': hasViolations ? undefined : { cursor: 'default' },
            '& .MuiAccordionSummary-expandIconWrapper': {
              mr: 0.5,
              ml: 0,
            },
            '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center', gap: 0.75, minWidth: 0 },
          }}
        >
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={entry.name}
            >
              {entry.name}
            </Typography>
            <Chip
              size="small"
              label={t(`rules.severity.${entry.severity}`)}
              color={severityColor(entry.severity)}
              variant="outlined"
              sx={{ height: 20, fontSize: 10, flexShrink: 0 }}
            />
            <Chip
              size="small"
              label={t('rules.violationsCount', { count })}
              color={hasViolations ? 'error' : 'default'}
              sx={{ height: 20, fontSize: 11, flexShrink: 0 }}
            />
          </Stack>
          {canViewJson ? (
            <Tooltip title={t('rules.viewJson')}>
              <IconButton
                size="small"
                aria-label={t('rules.viewJson')}
                onClick={event => {
                  event.stopPropagation();
                  setJsonOpen(true);
                }}
                sx={{ p: 0.25, mr: 0.5 }}
              >
                <DataObjectOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </AccordionSummary>
        {hasViolations ? (
          <AccordionDetails sx={{ px: 1, pt: 0, pb: 1 }}>
            <List dense disablePadding>
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
          </AccordionDetails>
        ) : null}
      </Accordion>
      {canViewJson ? (
        <RuleJsonDialog open={jsonOpen} ruleName={entry.name} rule={entry.rule} onClose={() => setJsonOpen(false)} />
      ) : null}
    </>
  );
}
