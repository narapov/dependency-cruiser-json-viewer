import Box from '@mui/material/Box';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { CircularList } from './partials/CircularList';

interface CircularPanelProps {
  onShowCycle: (paths: string[]) => void;
  onShowInGraph: (path: string) => void;
}

export function CircularPanel(props: CircularPanelProps) {
  const { onShowCycle, onShowInGraph } = props;

  const cycles = useWorkspaceStore(state => state.cruiseSnapshot.cycles);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <CircularList cycles={cycles} onShowCycle={onShowCycle} onShowInGraph={onShowInGraph} />
      </Box>
    </Box>
  );
}
