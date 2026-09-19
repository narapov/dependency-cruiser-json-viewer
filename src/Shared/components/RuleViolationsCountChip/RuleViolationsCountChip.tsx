import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';

interface RuleViolationsCountChipProps {
  count: number;
}

/** Error-colored chip showing the number of rule violations; renders nothing when count is 0. */
export function RuleViolationsCountChip({ count }: RuleViolationsCountChipProps) {
  const { t } = useTranslation();

  if (count === 0) {
    return null;
  }

  return (
    <Chip
      size="small"
      label={t('rules.violationsCount', { count })}
      color="error"
      sx={{ height: 20, fontSize: 11, flexShrink: 0 }}
    />
  );
}
