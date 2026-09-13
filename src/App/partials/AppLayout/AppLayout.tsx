import { type ReactNode } from 'react';

import Box from '@mui/material/Box';

import {
  APPLICABLE_RULES_PANEL_DEFAULT_WIDTH,
  APPLICABLE_RULES_PANEL_MIN_WIDTH,
  PANEL_MIN_WIDTH,
  SIDEBAR_MIN_WIDTH,
  useApplicableRulesPanelWidth,
  useDependenciesPanelWidth,
  useSidebarWidth,
  type SidebarView,
} from './hooks';
import { SIDEBAR_TOGGLE_WIDTH, SidebarToggle } from './partials/SidebarToggle';

export interface AppLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  dependenciesPanel: ReactNode | null;
  applicableRulesPanel: ReactNode | null;
  overlay: ReactNode | null;
  footer: ReactNode;
  dependenciesPanelOpen: boolean;
  applicableRulesPanelOpen: boolean;
  sidebarOpen: boolean;
  sidebarView: SidebarView;
  onSelectSidebarView: (view: SidebarView) => void;
}

const shellSx = {
  display: 'grid',
  height: '100%',
  minHeight: 0,
  gridTemplateAreas: `
    "header header header header"
    "sider  main   dependenciesPanel applicableRulesPanel"
    "footer footer footer footer"
  `,
  gridTemplateRows: 'auto 1fr auto',
} as const;

const regionSx = {
  minHeight: 0,
  overflow: 'hidden',
} as const;

const panelRegionSx = {
  minHeight: 0,
} as const;

const resizeHandleSx = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  zIndex: 2,
  width: 6,
  cursor: 'col-resize',
  touchAction: 'none',
  '&:hover': {
    bgcolor: 'action.hover',
  },
  '@media (hover: none)': {
    width: 12,
  },
} as const;

const panelAsideSx = {
  height: '100%',
  overflow: 'hidden',
  bgcolor: 'background.paper',
  borderLeft: 1,
  borderColor: 'divider',
} as const;

export function AppLayout({
  header,
  sidebar,
  main,
  dependenciesPanel,
  applicableRulesPanel,
  overlay,
  footer,
  dependenciesPanelOpen,
  applicableRulesPanelOpen,
  sidebarOpen,
  sidebarView,
  onSelectSidebarView,
}: AppLayoutProps) {
  const { sidebarWidth, onResizePointerDown, onResizeContextMenu } = useSidebarWidth();
  const leftOccupiedWidth = SIDEBAR_TOGGLE_WIDTH + (sidebarOpen ? sidebarWidth : 0);

  // Shell-only: reserve space for the other column when open (rules uses live deps width; deps uses rules default to avoid a render cycle).
  const {
    width: dependenciesPanelWidth,
    onResizePointerDown: onDependenciesPanelResizePointerDown,
    onResizeContextMenu: onDependenciesPanelResizeContextMenu,
  } = useDependenciesPanelWidth(
    leftOccupiedWidth + (applicableRulesPanelOpen ? APPLICABLE_RULES_PANEL_DEFAULT_WIDTH : 0),
  );

  const {
    width: applicableRulesPanelWidth,
    onResizePointerDown: onApplicableRulesPanelResizePointerDown,
    onResizeContextMenu: onApplicableRulesPanelResizeContextMenu,
  } = useApplicableRulesPanelWidth(leftOccupiedWidth + (dependenciesPanelOpen ? dependenciesPanelWidth : 0));

  const dependenciesColumnWidth = dependenciesPanelOpen ? dependenciesPanelWidth : 0;
  const applicableRulesColumnWidth = applicableRulesPanelOpen ? applicableRulesPanelWidth : 0;

  return (
    <Box
      sx={{
        ...shellSx,
        gridTemplateColumns: `${leftOccupiedWidth}px 1fr ${dependenciesColumnWidth}px ${applicableRulesColumnWidth}px`,
      }}
    >
      <Box
        component="header"
        sx={{
          gridArea: 'header',
          display: 'flex',
          alignItems: 'center',
          px: { xs: 1.5, sm: 3 },
          py: { xs: 0.75, md: 0 },
          bgcolor: 'appHeader.main',
        }}
      >
        {header}
      </Box>
      <Box sx={{ gridArea: 'sider', position: 'relative', display: 'flex', ...panelRegionSx }}>
        <SidebarToggle sidebarOpen={sidebarOpen} sidebarView={sidebarView} onSelectView={onSelectSidebarView} />
        <Box
          component="aside"
          sx={{
            flex: sidebarOpen ? 1 : 0,
            width: sidebarOpen ? undefined : 0,
            height: '100%',
            minWidth: 0,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            borderRight: sidebarOpen ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          {sidebar}
        </Box>
        {sidebarOpen && (
          <Box
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={sidebarWidth}
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            onPointerDown={onResizePointerDown}
            onContextMenu={onResizeContextMenu}
            sx={{ ...resizeHandleSx, right: 0, transform: 'translateX(50%)' }}
          />
        )}
      </Box>
      <Box component="main" sx={{ gridArea: 'main', ...regionSx }}>
        {main}
      </Box>
      <Box sx={{ gridArea: 'dependenciesPanel', position: 'relative', ...panelRegionSx }}>
        {dependenciesPanelOpen && (
          <Box
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={dependenciesPanelWidth}
            aria-valuemin={PANEL_MIN_WIDTH}
            onPointerDown={onDependenciesPanelResizePointerDown}
            onContextMenu={onDependenciesPanelResizeContextMenu}
            sx={{ ...resizeHandleSx, left: 0, transform: 'translateX(-50%)' }}
          />
        )}
        {dependenciesPanelOpen && dependenciesPanel && (
          <Box component="aside" sx={panelAsideSx}>
            {dependenciesPanel}
          </Box>
        )}
      </Box>
      <Box sx={{ gridArea: 'applicableRulesPanel', position: 'relative', ...panelRegionSx }}>
        {applicableRulesPanelOpen && (
          <Box
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={applicableRulesPanelWidth}
            aria-valuemin={APPLICABLE_RULES_PANEL_MIN_WIDTH}
            onPointerDown={onApplicableRulesPanelResizePointerDown}
            onContextMenu={onApplicableRulesPanelResizeContextMenu}
            sx={{ ...resizeHandleSx, left: 0, transform: 'translateX(-50%)' }}
          />
        )}
        {applicableRulesPanelOpen && applicableRulesPanel && (
          <Box component="aside" sx={panelAsideSx}>
            {applicableRulesPanel}
          </Box>
        )}
      </Box>
      {overlay}
      <Box component="footer" sx={{ gridArea: 'footer', ...regionSx }}>
        {footer}
      </Box>
    </Box>
  );
}
