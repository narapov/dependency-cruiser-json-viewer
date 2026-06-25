import { useCallback, useMemo, useState } from 'react'
import { Typography } from 'antd'
import type { TreeDataNode } from 'antd'
import type { IModule } from 'dependency-cruiser'
import { getAncestorKeys } from '../lib/dependencyGraph/pathUtils'
import {
  buildTreeIndex,
  getDefaultExpandedKeys,
  getDefaultSelectedKeys,
  toggleExpandedKey,
} from '../lib/treeSelection'
import { DependencyGraph } from './DependencyGraph'
import { FileTree } from './FileTree'
import styles from './AppLayout/AppLayout.module.css'

interface AppLayoutProps {
  treeData: TreeDataNode[]
  modules: IModule[]
  moduleCount?: number
  folderColors: ReadonlyMap<string, string>
}

export function AppLayout({ treeData, modules, moduleCount, folderColors }: AppLayoutProps) {
  const [selectedPaths, setSelectedPaths] = useState(() => getDefaultSelectedKeys(treeData))
  const [expandedKeys, setExpandedKeys] = useState(() => getDefaultExpandedKeys(treeData))
  const [focusPath, setFocusPath] = useState<string | null>(null)

  const treeIndex = useMemo(() => buildTreeIndex(treeData), [treeData])

  const onToggleFolder = useCallback((path: string) => {
    setExpandedKeys((keys) => toggleExpandedKey(keys, path))
  }, [])

  const handleShowInGraph = useCallback(
    (path: string) => {
      const ancestors = getAncestorKeys(path)
      const isFolder = (treeIndex.descendantsByKey.get(path)?.length ?? 0) > 0
      const keysToExpand = isFolder ? [...ancestors, path] : ancestors

      setExpandedKeys((keys) => [...new Set([...keys, ...keysToExpand])])
      setFocusPath(path)
    },
    [treeIndex],
  )

  const handleFocusComplete = useCallback(() => {
    setFocusPath(null)
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
          onExpand={setExpandedKeys}
          onShowInGraph={handleShowInGraph}
        />
      </aside>
      <main className={styles.main}>
        <DependencyGraph
          modules={modules}
          selectedPaths={selectedPaths}
          folderColors={folderColors}
          expandedKeys={expandedKeys}
          onToggleFolder={onToggleFolder}
          focusPath={focusPath}
          onFocusComplete={handleFocusComplete}
        />
      </main>
    </div>
  )
}
