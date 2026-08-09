import type { IModule } from 'dependency-cruiser';

import Box from '@mui/material/Box';

import { collectDistinctCycles } from '@/domain';

import { CircularList } from './partials/CircularList';

interface CircularPanelProps {
  modules: readonly IModule[];
  sources: readonly string[];
  onShowCycle: (paths: string[]) => void;
  onShowInGraph: (path: string) => void;
}

export function CircularPanel({ modules, sources, onShowCycle, onShowInGraph }: CircularPanelProps) {
  const sourceSet = new Set(sources);
  const cycles = collectDistinctCycles(modules)
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
