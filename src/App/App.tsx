import { useMemo } from 'react'
import { Alert, Spin, Typography } from 'antd'
import type { IModule } from 'dependency-cruiser'
import { AppLayout } from '../components/AppLayout'
import { DependencyGraph } from '../components/DependencyGraph'
import { DependencyPanel } from '../components/DependencyPanel'
import { FileTree } from '../components/FileTree'
import { QuickOpen } from '../components/QuickOpen'
import { assignFolderColors } from './helpers'
import { buildFileTree } from './helpers'
import { useAppOrchestration, useCruiseResult } from './hooks'
import styles from './App.module.css'

function AppHeader({ moduleCount }: { moduleCount?: number }) {
  return (
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
  )
}

function App() {
  const { data, isPending, isError, error } = useCruiseResult()

  const sources = useMemo(
    () => (data ? data.modules.map((m) => m.source) : []),
    [data],
  )

  const treeData = useMemo(() => (data ? buildFileTree(sources) : []), [data, sources])

  const folderColors = useMemo(() => assignFolderColors(sources), [sources])

  const orch = useAppOrchestration(treeData)

  if (isPending) {
    return (
      <div className={styles.centered}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.centered}>
        <Alert
          type="error"
          message="Failed to load cruise result"
          description={error.message}
          showIcon
        />
      </div>
    )
  }

  const modules: IModule[] = data.modules

  return (
    <AppLayout
      header={<AppHeader moduleCount={data.summary.totalCruised} />}
      sidebar={<FileTree {...orch.fileTreeProps} />}
      main={
        <DependencyGraph
          {...orch.graphProps}
          modules={modules}
          folderColors={folderColors}
        />
      }
      panel={
        orch.layoutProps.panelOpen ? (
          <DependencyPanel {...orch.panelProps} modules={modules} />
        ) : null
      }
      overlay={<QuickOpen {...orch.quickOpenProps} />}
      panelOpen={orch.layoutProps.panelOpen}
    />
  )
}

export default App
