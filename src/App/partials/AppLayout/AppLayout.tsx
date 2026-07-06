import type { ReactNode } from 'react';

import Box from '@mui/material/Box';

import { PANEL_MIN_WIDTH, SIDEBAR_MIN_WIDTH, useDependenciesPanelWidth, useSidebarWidth } from './hooks';
import { SIDEBAR_TOGGLE_WIDTH, SidebarToggle } from './partials/SidebarToggle';

export interface AppLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  panel: ReactNode | null;
  overlay: ReactNode | null;
  footer: ReactNode;
  panelOpen: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const shellSx = {
  display: 'grid',
  height: '100%',
  minHeight: 0,
  gridTemplateAreas: `
    "header header header"
    "sider  main   panel"
    "footer footer footer"
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

export function AppLayout({
  header,
  sidebar,
  main,
  panel,
  overlay,
  footer,
  panelOpen,
  sidebarOpen,
  onToggleSidebar,
}: AppLayoutProps) {
  const { sidebarWidth, onResizePointerDown, onResizeContextMenu } = useSidebarWidth();
  const leftOccupiedWidth = SIDEBAR_TOGGLE_WIDTH + (sidebarOpen ? sidebarWidth : 0);
  const {
    width: panelWidth,
    onResizePointerDown: onPanelResizePointerDown,
    onResizeContextMenu: onPanelResizeContextMenu,
  } = useDependenciesPanelWidth(leftOccupiedWidth);

  return (
    <Box
      sx={{
        ...shellSx,
        gridTemplateColumns: `${leftOccupiedWidth}px 1fr ${panelOpen ? panelWidth : 0}px`,
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
        <SidebarToggle sidebarOpen={sidebarOpen} onToggle={onToggleSidebar} />
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
      <Box sx={{ gridArea: 'panel', position: 'relative', ...panelRegionSx }}>
        {panelOpen && (
          <Box
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={panelWidth}
            aria-valuemin={PANEL_MIN_WIDTH}
            onPointerDown={onPanelResizePointerDown}
            onContextMenu={onPanelResizeContextMenu}
            sx={{ ...resizeHandleSx, left: 0, transform: 'translateX(-50%)' }}
          />
        )}
        {panelOpen && panel && (
          <Box
            component="aside"
            sx={{
              height: '100%',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            {panel}
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
