import { useMemo } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
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
    <Typography variant="subtitle1" component="h1" sx={{ margin: 0, color: '#fff', fontWeight: 600 }}>
      Deps Viewer
      {moduleCount != null && (
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          sx={{ marginLeft: 1.5, fontWeight: 400 }}
        >
          {moduleCount} modules
        </Typography>
      )}
    </Typography>
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
        <CircularProgress size={32} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.centered}>
        <Alert severity="error">
          <AlertTitle>Failed to load cruise result</AlertTitle>
          {error.message}
        </Alert>
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
