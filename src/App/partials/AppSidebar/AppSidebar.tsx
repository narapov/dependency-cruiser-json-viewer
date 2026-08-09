import type { IFlattenedRuleSet, IViolation } from 'dependency-cruiser';
import type { ReactNode, Ref } from 'react';

import Box from '@mui/material/Box';

import type { SidebarView } from '../AppLayout';
import { FileTree, type FileTreeHandle } from '../FileTree';
import { RulesPanel } from '../RulesPanel';

interface AppSidebarProps {
  view: SidebarView;
  fileTreeRef?: Ref<FileTreeHandle>;
  sources: string[];
  selectedKeys: string[];
  onSelect: (keys: string[]) => void;
  expandedKeys: string[];
  onExpand: (keys: string[]) => void;
  onExpandRecursive: (path: string) => void;
  onShowInGraph: (path: string) => void;
  onShowDependencies: (path: string) => void;
  activePath: string | null;
  ruleSetUsed: IFlattenedRuleSet | undefined;
  violations: readonly IViolation[] | undefined;
  onSelectViolationPaths: (paths: string[]) => void;
}

function ViewPanel({ active, children }: { active: boolean; children: ReactNode }) {
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

export function AppSidebar({
  view,
  fileTreeRef,
  sources,
  selectedKeys,
  onSelect,
  expandedKeys,
  onExpand,
  onExpandRecursive,
  onShowInGraph,
  onShowDependencies,
  activePath,
  ruleSetUsed,
  violations,
  onSelectViolationPaths,
}: AppSidebarProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ViewPanel active={view === 'files'}>
        <FileTree
          ref={fileTreeRef}
          sources={sources}
          selectedKeys={selectedKeys}
          onSelect={onSelect}
          expandedKeys={expandedKeys}
          onExpand={onExpand}
          onExpandRecursive={onExpandRecursive}
          onShowInGraph={onShowInGraph}
          onShowDependencies={onShowDependencies}
          activePath={activePath}
        />
      </ViewPanel>
      <ViewPanel active={view === 'rules'}>
        <RulesPanel
          ruleSetUsed={ruleSetUsed}
          violations={violations}
          sources={sources}
          onSelectViolationPaths={onSelectViolationPaths}
        />
      </ViewPanel>
    </Box>
  );
}
