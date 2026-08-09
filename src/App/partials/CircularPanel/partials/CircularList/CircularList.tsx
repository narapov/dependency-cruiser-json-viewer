import { useTranslation } from 'react-i18next';

import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import type { DistinctCycle } from '@/domain';

import { CircularListItem } from '../CircularListItem';

interface CircularListProps {
  cycles: DistinctCycle[];
  onShowCycle: (paths: string[]) => void;
  onShowInGraph: (path: string) => void;
}

export function CircularList({ cycles, onShowCycle, onShowInGraph }: CircularListProps) {
  const { t } = useTranslation();

  if (cycles.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
        {t('circular.empty')}
      </Typography>
    );
  }

  return (
    <List dense disablePadding sx={{ py: 0.5 }}>
      {cycles.map(cycle => (
        <CircularListItem
          key={cycle.paths.join('\0')}
          paths={cycle.paths}
          onShowCycle={onShowCycle}
          onShowInGraph={onShowInGraph}
        />
      ))}
    </List>
  );
}
