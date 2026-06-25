import { useMemo } from 'react'
import { Alert, Spin } from 'antd'
import { AppLayout } from './components/AppLayout'
import { useCruiseResult } from './hooks/useCruiseResult'
import { assignFolderColors } from './lib/assignFolderColors'
import { buildFileTree } from './lib/buildFileTree'
import styles from './App.module.css'

function App() {
  const { data, isPending, isError, error } = useCruiseResult()

  const sources = useMemo(
    () => (data ? data.modules.map((m) => m.source) : []),
    [data],
  )

  const treeData = useMemo(() => (data ? buildFileTree(sources) : []), [data, sources])

  const folderColors = useMemo(() => assignFolderColors(sources), [sources])

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

  return (
    <AppLayout
      treeData={treeData}
      modules={data.modules}
      moduleCount={data.summary.totalCruised}
      folderColors={folderColors}
    />
  )
}

export default App
