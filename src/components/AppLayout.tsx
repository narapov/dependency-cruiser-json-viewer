import { useCallback, useState } from 'react'
import { Typography } from 'antd'
import type { TreeNodeData } from './Tree'
import type { IModule } from 'dependency-cruiser'
import { getAncestorKeys } from '../lib/dependencyGraph/pathUtils'
import {
  getDefaultExpandedKeys,
  getDefaultSelectedKeys,
  resolveActivePathAfterCollapse,
  toggleExpandedKey,
} from '../lib/treeSelection'
import { DependencyGraph } from './DependencyGraph'
import { DependencyDrawer } from './DependencyDrawer/DependencyDrawer'
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
  const [drawerPath, setDrawerPath] = useState<string | null>(null)

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
    setDrawerPath(path)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerPath(null)
  }, [])

  return (
    <div className={styles.shell}>
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
      <aside className={styles.sider}>
        <FileTree
          treeData={treeData}
          selectedKeys={selectedPaths}
          onSelect={setSelectedPaths}
          expandedKeys={expandedKeys}
          onExpand={updateExpandedKeys}
          onShowInGraph={handleShowInGraph}
          onShowDependencies={handleShowDependencies}
          activePath={activePath}
        />
      </aside>
      <main className={styles.main}>
        <DependencyGraph
          modules={modules}
          selectedPaths={selectedPaths}
          folderColors={folderColors}
          expandedKeys={expandedKeys}
          onToggleFolder={onToggleFolder}
          onShowInFileTree={handleShowInFileTree}
          onShowDependencies={handleShowDependencies}
          onActivePathChange={handleActivePathChange}
          activePath={activePath}
          graphFitToken={graphFitToken}
        />
        <DependencyDrawer
          open={drawerPath != null}
          path={drawerPath}
          modules={modules}
          selectedPaths={selectedPaths}
          expandedKeys={expandedKeys}
          onClose={handleCloseDrawer}
          onShowInGraph={handleShowInGraph}
        />
      </main>
    </div>
  )
}
