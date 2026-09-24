import Box from '@mui/material/Box';

import { useCruiseTreeRequired } from '../../contexts';
import { CircularList } from './partials/CircularList';

interface CircularPanelProps {
  onShowCycle: (paths: string[]) => void;
  onShowInGraph: (path: string) => void;
}

export function CircularPanel(props: CircularPanelProps) {
  const { onShowCycle, onShowInGraph } = props;

  const cruiseTree = useCruiseTreeRequired();
  const sourceSet = new Set(cruiseTree.modulePaths);
  const cycles = cruiseTree.cycles
    .map(cycle => ({
      paths: cycle.paths.filter(path => sourceSet.has(path)),
    }))
    .filter(cycle => cycle.paths.length > 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <CircularList cycles={cycles} onShowCycle={onShowCycle} onShowInGraph={onShowInGraph} />
      </Box>
    </Box>
  );
}
