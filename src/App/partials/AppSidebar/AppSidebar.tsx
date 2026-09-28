import type { IFlattenedRuleSet, IViolation } from 'dependency-cruiser';
import type { ReactNode, Ref } from 'react';

import Box from '@mui/material/Box';

import type { SidebarView } from '../AppLayout';
import { CircularPanel } from '../CircularPanel';
import { FileTree, type FileTreeHandle } from '../FileTree';
import { HighlightsPanel } from '../HighlightsPanel';
import { RulesPanel } from '../RulesPanel';

interface AppSidebarProps {
  view: SidebarView;
  fileTreeRef?: Ref<FileTreeHandle>;
  onShowInGraph: (path: string) => void;
  onViewModuleJson: (path: string) => void;
  ruleSetUsed: IFlattenedRuleSet | undefined;
  violations: readonly IViolation[] | ReadonlyMap<string, readonly IViolation[]> | undefined;
  onSelectViolationPaths: (paths: string[]) => void;
  onShowRuleViolations: (ruleName: string) => void;
  onShowCycle: (paths: string[]) => void;
  highlights: ReadonlyMap<string, string>;
  onRemoveHighlightKeys: (keys: readonly string[]) => void;
  onShowHighlightConnection: (source: string, target: string) => void;
  onClearAllHighlights: () => void;
}

function ViewPanel(props: { active: boolean; children: ReactNode }) {
  const { active, children } = props;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: active ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
      }}
      hidden={!active}
    >
      {children}
    </Box>
  );
}

export function AppSidebar(props: AppSidebarProps) {
  const {
    view,
    fileTreeRef,
    onShowInGraph,
    onViewModuleJson,
    ruleSetUsed,
    violations,
    onSelectViolationPaths,
    onShowRuleViolations,
    onShowCycle,
    highlights,
    onRemoveHighlightKeys,
    onShowHighlightConnection,
    onClearAllHighlights,
  } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ViewPanel active={view === 'files'}>
        <FileTree ref={fileTreeRef} onShowInGraph={onShowInGraph} onViewModuleJson={onViewModuleJson} />
      </ViewPanel>
      <ViewPanel active={view === 'rules'}>
        <RulesPanel
          ruleSetUsed={ruleSetUsed}
          violations={violations}
          onSelectViolationPaths={onSelectViolationPaths}
          onShowRuleViolations={onShowRuleViolations}
        />
      </ViewPanel>
      <ViewPanel active={view === 'circular'}>
        <CircularPanel onShowCycle={onShowCycle} onShowInGraph={onShowInGraph} />
      </ViewPanel>
      <ViewPanel active={view === 'highlights'}>
        <HighlightsPanel
          highlights={highlights}
          onRemoveDependencyKeys={onRemoveHighlightKeys}
          onShowConnection={onShowHighlightConnection}
          onClearAll={onClearAllHighlights}
        />
      </ViewPanel>
    </Box>
  );
}
