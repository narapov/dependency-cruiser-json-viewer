import type { ReactNode } from 'react'
import type { CSSProperties } from 'react'
import {
  PANEL_MIN_WIDTH,
  SIDEBAR_MIN_WIDTH,
  useDependenciesPanelWidth,
  useSidebarWidth,
} from './hooks'
import styles from './AppLayout.module.css'

export interface AppLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  main: ReactNode
  panel: ReactNode | null
  overlay: ReactNode | null
  panelOpen: boolean
}

export function AppLayout({
  header,
  sidebar,
  main,
  panel,
  overlay,
  panelOpen,
}: AppLayoutProps) {
  const { sidebarWidth, onResizePointerDown } = useSidebarWidth()
  const { width: panelWidth, onResizePointerDown: onPanelResizePointerDown } =
    useDependenciesPanelWidth(sidebarWidth)

  return (
    <div
      className={styles.shell}
      style={
        {
          '--sider-width': `${sidebarWidth}px`,
          '--panel-width': panelOpen ? `${panelWidth}px` : '0px',
        } as CSSProperties
      }
    >
      <header className={styles.header}>{header}</header>
      <div className={styles.siderContainer}>
        <aside className={styles.sider}>{sidebar}</aside>
        <div
          className={styles.resizeHandle}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={sidebarWidth}
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          onPointerDown={onResizePointerDown}
        />
      </div>
      <main className={styles.main}>{main}</main>
      <div className={styles.panelContainer}>
        {panelOpen && (
          <div
            className={styles.panelResizeHandle}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={panelWidth}
            aria-valuemin={PANEL_MIN_WIDTH}
            onPointerDown={onPanelResizePointerDown}
          />
        )}
        {panelOpen && panel && <aside className={styles.panel}>{panel}</aside>}
      </div>
      {overlay}
    </div>
  )
}
