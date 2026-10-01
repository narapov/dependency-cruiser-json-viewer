import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import type { DistinctCycle } from '@/domain';

import { CircularListItem } from '../CircularListItem';

interface CircularSectionProps {
  title: string;
  cycles: DistinctCycle[];
  onShowCycle: (paths: string[]) => void;
  onShowInGraph: (path: string) => void;
}

export function CircularSection(props: CircularSectionProps) {
  const { title, cycles, onShowCycle, onShowInGraph } = props;

  if (cycles.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1.5, py: 0.75 }}>
        {title} ({cycles.length})
      </Typography>
      <List dense disablePadding>
        {cycles.map(cycle => (
          <CircularListItem
            key={cycle.members.map(member => member.path).join('\0')}
            members={cycle.members}
            onShowCycle={onShowCycle}
            onShowInGraph={onShowInGraph}
          />
        ))}
      </List>
    </Box>
  );
}
