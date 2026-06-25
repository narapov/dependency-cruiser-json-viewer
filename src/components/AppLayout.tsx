import { useState } from 'react'
import { Typography } from 'antd'
import type { TreeDataNode } from 'antd'
import type { IModule } from 'dependency-cruiser'
import { getDefaultExpandedKeys, getDefaultSelectedKeys } from '../lib/treeSelection'
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
        />
      </aside>
      <main className={styles.main}>
        <DependencyGraph
          modules={modules}
          selectedPaths={selectedPaths}
          folderColors={folderColors}
        />
      </main>
    </div>
  )
}
