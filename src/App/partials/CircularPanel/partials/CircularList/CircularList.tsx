import { useTranslation } from 'react-i18next';

import Typography from '@mui/material/Typography';

import type { DistinctCycle } from '@/domain';

import { CircularSection } from '../CircularSection';

interface CircularListProps {
  cycles: DistinctCycle[];
  onShowCycle: (paths: string[]) => void;
  onShowInGraph: (path: string) => void;
}

export function CircularList(props: CircularListProps) {
  const { cycles, onShowCycle, onShowInGraph } = props;

  const { t } = useTranslation();

  if (cycles.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
        {t('circular.empty')}
      </Typography>
    );
  }

  const withoutIgnored = cycles.filter(cycle => cycle.members.every(member => !member.ignored));
  const withIgnored = cycles.filter(
    cycle => cycle.members.some(member => member.ignored) && cycle.members.some(member => !member.ignored),
  );
  const fullyIgnored = cycles.filter(cycle => cycle.members.every(member => member.ignored));

  return (
    <>
      <CircularSection
        title={t('circular.withoutIgnored')}
        cycles={withoutIgnored}
        onShowCycle={onShowCycle}
        onShowInGraph={onShowInGraph}
      />
      <CircularSection
        title={t('circular.withIgnored')}
        cycles={withIgnored}
        onShowCycle={onShowCycle}
        onShowInGraph={onShowInGraph}
      />
      <CircularSection
        title={t('circular.fullyIgnored')}
        cycles={fullyIgnored}
        onShowCycle={onShowCycle}
        onShowInGraph={onShowInGraph}
      />
    </>
  );
}
