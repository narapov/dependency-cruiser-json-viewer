import clsx from 'clsx';
import { memo, type Ref } from 'react';

import { ReactFlowProvider } from '@xyflow/react';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { GraphCanvas } from './partials/GraphCanvas';
import { GraphEmptySelection } from './partials/GraphEmptySelection';
import type { DependencyGraphHandle } from './types';

import styles from './DependencyGraph.module.css';

function hasAnyPresent(record: Record<string, boolean | undefined>): boolean {
  return Object.values(record).some(present => present === true);
}

interface DependencyGraphProps {
  ref?: Ref<DependencyGraphHandle>;
  onShowInFileTree: (path: string) => void;
  onViewModuleJson: (path: string) => void;
}

export const DependencyGraph = memo(function DependencyGraph(props: DependencyGraphProps) {
  const { ref, onShowInFileTree, onViewModuleJson } = props;

  const autoLayoutOnly = useWorkspaceStore(state => state.graphSettings.autoLayoutOnly);
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);

  const hasSelection = hasAnyPresent(selectedFilePaths);

  return (
    <div className={clsx(styles.container, autoLayoutOnly && styles.layoutLocked)}>
      {hasSelection ? (
        <ReactFlowProvider>
          <GraphCanvas ref={ref} onShowInFileTree={onShowInFileTree} onViewModuleJson={onViewModuleJson} />
        </ReactFlowProvider>
      ) : (
        <GraphEmptySelection />
      )}
    </div>
  );
});
