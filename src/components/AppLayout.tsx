import { useCallback, useState, type CSSProperties } from 'react'
import { Typography } from 'antd'
import type { TreeNodeData } from './Tree'
import type { IModule } from 'dependency-cruiser'
import { getAncestorKeys } from '../lib/dependencyGraph/pathUtils'
import {
  getDefaultExpandedKeys,
  getDefaultSelectedKeys,
  getSubtreeFolderKeys,
  resolveActivePathAfterCollapse,
  toggleExpandedKey,
} from '../lib/treeSelection'
import {
  MIN_WIDTH as PANEL_MIN_WIDTH,
  useDependenciesPanelWidth,
} from '../hooks/useDependenciesPanelWidth'
import { MIN_WIDTH, useSidebarWidth } from '../hooks/useSidebarWidth'
import { DependencyGraph } from './DependencyGraph'
import { DependencyPanel } from './DependencyPanel/DependencyPanel'
import { FileTree } from './FileTree'
import styles from './AppLayout/AppLayout.module.css'

interface AppLayoutProps {
  treeData: TreeNodeData[]
  modules: IModule[]
  moduleCount?: number
  folderColors: ReadonlyMap<string, string>
}

export function AppLayout({ treeData, modules, moduleCount, folderColors }: AppLayoutProps) {
  const [selectedPaths, setSelectedPaths] = useState(() => getDefaultSelectedKeys(treeData))
  const [expandedKeys, setExpandedKeys] = useState(() => getDefaultExpandedKeys(treeData))
  const [activePath, setActivePath] = useState<string | null>(null)
  const [graphFitToken, setGraphFitToken] = useState(0)
  const [dependenciesPath, setDependenciesPath] = useState<string | null>(null)
  const { sidebarWidth, onResizePointerDown } = useSidebarWidth()
  const { width: panelWidth, onResizePointerDown: onPanelResizePointerDown } =
    useDependenciesPanelWidth(sidebarWidth)

  const panelOpen = dependenciesPath != null

  const updateExpandedKeys = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      setExpandedKeys((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        const collapsed = prev.filter((key) => !next.includes(key))
        if (collapsed.length > 0) {
          setActivePath((current) => resolveActivePathAfterCollapse(current, collapsed))
        }
        return next
      })
    },
    [],
  )

  const onToggleFolder = useCallback(
    (path: string) => updateExpandedKeys((keys) => toggleExpandedKey(keys, path)),
    [updateExpandedKeys],
  )

  const onExpandRecursive = useCallback(
    (path: string) => {
      updateExpandedKeys((keys) => [
        ...new Set([...keys, ...getSubtreeFolderKeys(path, treeData)]),
      ])
    },
    [treeData, updateExpandedKeys],
  )

  const activatePath = useCallback((path: string) => {
    const ancestors = getAncestorKeys(path)
    setExpandedKeys((keys) => [...new Set([...keys, ...ancestors])])
    setActivePath(path)
  }, [])

  const handleShowInGraph = useCallback((path: string) => {
    const ancestors = getAncestorKeys(path)

    setExpandedKeys((keys) => [...new Set([...keys, ...ancestors])])
    setActivePath(path)
    setGraphFitToken((token) => token + 1)
  }, [])

  const handleShowInFileTree = useCallback(
    (path: string) => {
      activatePath(path)
    },
    [activatePath],
  )

  const handleActivePathChange = useCallback(
    (path: string) => {
      activatePath(path)
    },
    [activatePath],
  )

  const handleShowDependencies = useCallback((path: string) => {
    setDependenciesPath(path)
  }, [])

  const handleClosePanel = useCallback(() => {
    setDependenciesPath(null)
  }, [])

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
      <header className={styles.header}>
        <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
          Deps Viewer
          {moduleCount != null && (
            <Typography.Text
              type="secondary"
              style={{ marginLeft: 12, fontSize: 14, fontWeight: 400 }}
            >
              {moduleCount} modules
            </Typography.Text>
          )}
        </Typography.Title>
      </header>
      <div className={styles.siderContainer}>
        <aside className={styles.sider}>
          <FileTree
            treeData={treeData}
            selectedKeys={selectedPaths}
            onSelect={setSelectedPaths}
            expandedKeys={expandedKeys}
            onExpand={updateExpandedKeys}
            onExpandRecursive={onExpandRecursive}
            onShowInGraph={handleShowInGraph}
            onShowDependencies={handleShowDependencies}
            activePath={activePath}
          />
        </aside>
        <div
          className={styles.resizeHandle}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={sidebarWidth}
          aria-valuemin={MIN_WIDTH}
          onPointerDown={onResizePointerDown}
        />
      </div>
      <main className={styles.main}>
        <DependencyGraph
          modules={modules}
          selectedPaths={selectedPaths}
          folderColors={folderColors}
          expandedKeys={expandedKeys}
          onToggleFolder={onToggleFolder}
          onExpandRecursive={onExpandRecursive}
          onShowInFileTree={handleShowInFileTree}
          onShowDependencies={handleShowDependencies}
          onActivePathChange={handleActivePathChange}
          activePath={activePath}
          graphFitToken={graphFitToken}
        />
      </main>
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
        {panelOpen && dependenciesPath && (
          <aside className={styles.panel}>
            <DependencyPanel
              path={dependenciesPath}
              modules={modules}
              selectedPaths={selectedPaths}
              expandedKeys={expandedKeys}
              onClose={handleClosePanel}
              onShowInGraph={handleShowInGraph}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
