import { type ReactNode } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import Box from '@mui/material/Box';

import { useAppPanelsLayout, type SidebarView } from './hooks';
import { SidebarToggle } from './partials/SidebarToggle';

import styles from './AppLayout.module.css';

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

const SIDEBAR_MIN_SIZE = 150;
const SIDEBAR_DEFAULT_SIZE = 280;
const GRAPH_MIN_SIZE = 120;
const PANEL_MIN_SIZE = 200;
const PANEL_DEFAULT_SIZE = 360;

const shellSx = {
  display: 'grid',
  height: '100%',
  minHeight: 0,
  gridTemplateAreas: `
    "header"
    "body"
    "footer"
  `,
  gridTemplateRows: 'auto 1fr auto',
  gridTemplateColumns: '1fr',
} as const;

const regionSx = {
  minHeight: 0,
  overflow: 'hidden',
} as const;

const panelContentSx = {
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
} as const;

const sidebarPanelSx = {
  ...panelContentSx,
  bgcolor: 'background.paper',
  borderRight: 1,
  borderColor: 'divider',
} as const;

const rightPanelSx = {
  ...panelContentSx,
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
  const { defaultLayout, onLayoutChanged } = useAppPanelsLayout();

  const showDependencies = dependenciesPanelOpen && dependenciesPanel != null;
  const showApplicableRules = applicableRulesPanelOpen && applicableRulesPanel != null;

  return (
    <Box sx={shellSx}>
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
      <Box sx={{ gridArea: 'body', display: 'flex', ...regionSx }}>
        <SidebarToggle sidebarOpen={sidebarOpen} sidebarView={sidebarView} onSelectView={onSelectSidebarView} />
        <Group
          id="app-panels"
          orientation="horizontal"
          style={{ flex: 1, minWidth: 0, height: '100%' }}
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
          resizeTargetMinimumSize={{ fine: 5, coarse: 20 }}
        >
          {sidebarOpen && (
            <Panel
              id="sidebar"
              minSize={SIDEBAR_MIN_SIZE}
              defaultSize={SIDEBAR_DEFAULT_SIZE}
              groupResizeBehavior="preserve-pixel-size"
            >
              <Box component="aside" sx={sidebarPanelSx}>
                {sidebar}
              </Box>
            </Panel>
          )}
          {sidebarOpen && <Separator className={styles.separator} />}
          <Panel id="graph" minSize={GRAPH_MIN_SIZE}>
            <Box component="main" sx={panelContentSx}>
              {main}
            </Box>
          </Panel>
          {showDependencies && <Separator className={styles.separator} />}
          {showDependencies && (
            <Panel
              id="dependencies"
              minSize={PANEL_MIN_SIZE}
              defaultSize={PANEL_DEFAULT_SIZE}
              groupResizeBehavior="preserve-pixel-size"
            >
              <Box component="aside" sx={rightPanelSx}>
                {dependenciesPanel}
              </Box>
            </Panel>
          )}
          {showApplicableRules && <Separator className={styles.separator} />}
          {showApplicableRules && (
            <Panel
              id="applicableRules"
              minSize={PANEL_MIN_SIZE}
              defaultSize={PANEL_DEFAULT_SIZE}
              groupResizeBehavior="preserve-pixel-size"
            >
              <Box component="aside" sx={rightPanelSx}>
                {applicableRulesPanel}
              </Box>
            </Panel>
          )}
        </Group>
      </Box>
      {overlay}
      <Box component="footer" sx={{ gridArea: 'footer', ...regionSx }}>
        {footer}
      </Box>
    </Box>
  );
}
