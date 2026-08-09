import { useTranslation } from 'react-i18next';

import Typography from '@mui/material/Typography';

import type { RuleWithViolations } from '@/domain';

import { RulesSection } from '../RulesSection';

interface RulesListProps {
  rules: RuleWithViolations[];
  filteredRules: RuleWithViolations[];
  nameFilter: string;
  onSelectViolationPaths: (paths: string[]) => void;
}

export function RulesList({ rules, filteredRules, nameFilter, onSelectViolationPaths }: RulesListProps) {
  const { t } = useTranslation();

  if (rules.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
        {t('rules.empty')}
      </Typography>
    );
  }

  if (filteredRules.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
        {t('rules.noMatches')}
      </Typography>
    );
  }

  const withViolations = filteredRules.filter(entry => entry.violations.length > 0);
  const withoutViolations = filteredRules.filter(entry => entry.violations.length === 0);

  return (
    <>
      <RulesSection
        title={t('rules.withViolations')}
        entries={withViolations}
        nameFilter={nameFilter}
        onSelectViolationPaths={onSelectViolationPaths}
      />
      <RulesSection
        title={t('rules.withoutViolations')}
        entries={withoutViolations}
        nameFilter={nameFilter}
        onSelectViolationPaths={onSelectViolationPaths}
      />
    </>
  );
}
