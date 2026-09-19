import type { SeverityType } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';

import { severityChipColor } from './helpers';

interface RuleSeverityChipProps {
  severity: SeverityType;
}

/** Outlined severity chip for cruise rules (error / warn / info / ignore). */
export function RuleSeverityChip({ severity }: RuleSeverityChipProps) {
  const { t } = useTranslation();

  return (
    <Chip
      size="small"
      label={t(`rules.severity.${severity}`)}
      color={severityChipColor(severity)}
      variant="outlined"
      sx={{ height: 20, fontSize: 10, flexShrink: 0 }}
    />
  );
}
