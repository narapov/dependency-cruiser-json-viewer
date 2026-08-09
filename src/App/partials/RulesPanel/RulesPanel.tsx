import type { IFlattenedRuleSet, IViolation } from 'dependency-cruiser';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { groupRulesWithViolations, type RuleWithViolations } from '@/domain';

import { RuleListItem } from './partials/RuleListItem';

interface RulesPanelProps {
  ruleSetUsed: IFlattenedRuleSet | undefined;
  violations: readonly IViolation[] | undefined;
  sources: readonly string[];
  onSelectViolationPaths: (paths: string[]) => void;
}

function matchesNameFilter(name: string, filter: string): boolean {
  const trimmed = filter.trim();
  if (trimmed.length === 0) {
    return true;
  }
  return name.toLowerCase().includes(trimmed.toLowerCase());
}

function RulesSection({
  title,
  entries,
  onSelectViolationPaths,
}: {
  title: string;
  entries: RuleWithViolations[];
  onSelectViolationPaths: (paths: string[]) => void;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1.5, py: 0.75 }}>
        {title} ({entries.length})
      </Typography>
      {entries.map(entry => (
        <RuleListItem key={entry.name} entry={entry} onSelectViolationPaths={onSelectViolationPaths} />
      ))}
    </Box>
  );
}

export function RulesPanel({ ruleSetUsed, violations, sources, onSelectViolationPaths }: RulesPanelProps) {
  const { t } = useTranslation();
  const [nameFilter, setNameFilter] = useState('');
  const rules = groupRulesWithViolations(ruleSetUsed, violations, sources);
  const filteredRules = rules.filter(entry => matchesNameFilter(entry.name, nameFilter));
  const withViolations = filteredRules.filter(entry => entry.violations.length > 0);
  const withoutViolations = filteredRules.filter(entry => entry.violations.length === 0);

  let listContent: ReactNode;
  if (rules.length === 0) {
    listContent = (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
        {t('rules.empty')}
      </Typography>
    );
  } else if (filteredRules.length === 0) {
    listContent = (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
        {t('rules.noMatches')}
      </Typography>
    );
  } else {
    listContent = (
      <>
        <RulesSection
          title={t('rules.withViolations')}
          entries={withViolations}
          onSelectViolationPaths={onSelectViolationPaths}
        />
        <RulesSection
          title={t('rules.withoutViolations')}
          entries={withoutViolations}
          onSelectViolationPaths={onSelectViolationPaths}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, px: 1, pt: 1, pb: 0.5 }}>
        <TextField
          size="small"
          fullWidth
          value={nameFilter}
          onChange={event => setNameFilter(event.target.value)}
          placeholder={t('rules.filterPlaceholder')}
          slotProps={{
            htmlInput: {
              'aria-label': t('rules.filterPlaceholder'),
            },
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{listContent}</Box>
    </Box>
  );
}
