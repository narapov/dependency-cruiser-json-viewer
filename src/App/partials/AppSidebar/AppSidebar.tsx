import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';
import type { ReactNode, Ref } from 'react';

import Box from '@mui/material/Box';

import type { SidebarView } from '../AppLayout';
import { CircularPanel } from '../CircularPanel';
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
  onShowDependenciesPanel: (path: string) => void;
  activePath: string | null;
  ruleSetUsed: IFlattenedRuleSet | undefined;
  violations: readonly IViolation[] | undefined;
  onSelectViolationPaths: (paths: string[]) => void;
  modules: readonly IModule[];
  onShowCycle: (paths: string[]) => void;
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
  onShowDependenciesPanel,
  activePath,
  ruleSetUsed,
  violations,
  onSelectViolationPaths,
  modules,
  onShowCycle,
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
          onShowDependenciesPanel={onShowDependenciesPanel}
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
      <ViewPanel active={view === 'circular'}>
        <CircularPanel modules={modules} sources={sources} onShowCycle={onShowCycle} onShowInGraph={onShowInGraph} />
      </ViewPanel>
    </Box>
  );
}
