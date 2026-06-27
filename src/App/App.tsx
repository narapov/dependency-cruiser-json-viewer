import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import CircularProgress from '@mui/material/CircularProgress'
import type { IModule } from 'dependency-cruiser'
import { useMemo, useRef } from 'react'
import { AppLayout } from '../components/AppLayout'
import { DependencyGraph, type DependencyGraphHandle } from '../components/DependencyGraph'
import { DependencyPanel } from '../components/DependencyPanel'
import { FileTree, type FileTreeHandle } from '../components/FileTree'
import { QuickOpen } from '../components/QuickOpen'
import { useAppOrchestration, useCruiseResult, useInitialDependencyCruiserState } from './hooks'
import { AppHeader } from './partials/AppHeader'
import styles from './App.module.css'

function App() {
  const { data, isPending, isError, error } = useCruiseResult()
  const fileTreeRef = useRef<FileTreeHandle>(null)
  const graphRef = useRef<DependencyGraphHandle>(null)

  const sources = useMemo(
    () => data?.modules.map((module) => module.source) ?? [],
    [data?.modules],
  )
  const initialDependencyCruiserState = useInitialDependencyCruiserState(sources)
  const orch = useAppOrchestration({ sources, fileTreeRef, graphRef, initialDependencyCruiserState })

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
      sidebar={
        <FileTree
          ref={fileTreeRef}
          sources={sources}
          selectedKeys={orch.selectedPaths}
          onSelect={orch.setSelectedPaths}
          expandedKeys={orch.expandedKeys}
          onExpand={orch.updateExpandedKeys}
          onExpandRecursive={orch.expandRecursive}
          onShowInGraph={orch.showInGraph}
          onShowDependencies={orch.handleShowDependencies}
          activePath={orch.activePath}
        />
      }
      main={
        <DependencyGraph
          ref={graphRef}
          modules={modules}
          selectedPaths={orch.selectedPaths}
          expandedKeys={orch.expandedKeys}
          onToggleFolder={orch.toggleFolder}
          onExpandRecursive={orch.expandRecursive}
          onShowInFileTree={orch.showInFileTree}
          onShowDependencies={orch.handleShowDependencies}
          onActivePathChange={orch.activatePath}
          activePath={orch.activePath}
        />
      }
      panel={
        orch.panelOpen ? (
          <DependencyPanel
            path={orch.dependenciesPath!}
            modules={modules}
            selectedPaths={orch.selectedPaths}
            expandedKeys={orch.expandedKeys}
            onClose={orch.handleClosePanel}
            onShowInGraph={orch.showInGraph}
          />
        ) : null
      }
      overlay={<QuickOpen sources={sources} onSelect={orch.handleQuickOpenSelect} />}
      panelOpen={orch.panelOpen}
    />
  )
}

export default App
