import { useTranslation } from 'react-i18next';

import Typography from '@mui/material/Typography';

import type { RuleWithViolations } from '@/domain';

import { ApplicableRulesSection } from '../ApplicableRulesSection';

interface ApplicableRulesListProps {
  rules: RuleWithViolations[];
  onSelectViolationPaths: (paths: string[]) => void;
}

export function ApplicableRulesList({ rules, onSelectViolationPaths }: ApplicableRulesListProps) {
  const { t } = useTranslation();

  if (rules.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1 }}>
        {t('applicableRulesPanel.empty')}
      </Typography>
    );
  }

  const withViolations = rules.filter(entry => entry.violations.length > 0);
  const withoutViolations = rules.filter(entry => entry.violations.length === 0);

  return (
    <>
      <ApplicableRulesSection
        title={t('rules.withViolations')}
        entries={withViolations}
        onSelectViolationPaths={onSelectViolationPaths}
      />
      <ApplicableRulesSection
        title={t('rules.withoutViolations')}
        entries={withoutViolations}
        onSelectViolationPaths={onSelectViolationPaths}
      />
    </>
  );
}
