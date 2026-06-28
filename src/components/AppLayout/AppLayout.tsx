import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import {
  PANEL_MIN_WIDTH,
  SIDEBAR_MIN_WIDTH,
  useDependenciesPanelWidth,
  useSidebarWidth,
} from './hooks'

export interface AppLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  main: ReactNode
  panel: ReactNode | null
  overlay: ReactNode | null
  footer: ReactNode
  panelOpen: boolean
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
} as const

const regionSx = {
  minHeight: 0,
  overflow: 'hidden',
} as const

const resizeHandleSx = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  zIndex: 1,
  width: 6,
  cursor: 'col-resize',
  touchAction: 'none',
  '&:hover': {
    bgcolor: 'action.hover',
  },
} as const

export function AppLayout({
  header,
  sidebar,
  main,
  panel,
  overlay,
  footer,
  panelOpen,
}: AppLayoutProps) {
  const { sidebarWidth, onResizePointerDown } = useSidebarWidth()
  const { width: panelWidth, onResizePointerDown: onPanelResizePointerDown } =
    useDependenciesPanelWidth(sidebarWidth)

  return (
    <Box
      sx={{
        ...shellSx,
        gridTemplateColumns: `${sidebarWidth}px 1fr ${panelOpen ? panelWidth : 0}px`,
      }}
    >
      <Box
        component="header"
        sx={{
          gridArea: 'header',
          display: 'flex',
          alignItems: 'center',
          px: 3,
          bgcolor: 'appHeader.main',
        }}
      >
        {header}
      </Box>
      <Box sx={{ gridArea: 'sider', position: 'relative', ...regionSx }}>
        <Box
          component="aside"
          sx={{
            height: '100%',
            minWidth: 0,
            overflowX: 'hidden',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          {sidebar}
        </Box>
        <Box
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={sidebarWidth}
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          onPointerDown={onResizePointerDown}
          sx={{ ...resizeHandleSx, right: 0, transform: 'translateX(50%)' }}
        />
      </Box>
      <Box component="main" sx={{ gridArea: 'main', ...regionSx }}>
        {main}
      </Box>
      <Box sx={{ gridArea: 'panel', position: 'relative', ...regionSx }}>
        {panelOpen && (
          <Box
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={panelWidth}
            aria-valuemin={PANEL_MIN_WIDTH}
            onPointerDown={onPanelResizePointerDown}
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
  )
}
