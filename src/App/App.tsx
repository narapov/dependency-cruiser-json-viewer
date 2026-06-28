import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import CircularProgress from '@mui/material/CircularProgress'
import type { IModule } from 'dependency-cruiser'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '../components/AppLayout'
import { DependencyGraph, type DependencyGraphHandle } from '../components/DependencyGraph'
import { DependencyPanel } from '../components/DependencyPanel'
import { FileTree, type FileTreeHandle } from '../components/FileTree'
import { QuickPick, type QuickPickHandle } from '../components/QuickPick'
import { useAppCommands, useAppOrchestration, useCruiseResult, useInitialDependencyCruiserState } from './hooks'
import { AppHeader } from './partials/AppHeader'
import { AppStatusBar } from './partials/AppStatusBar'
import { LanguagePickerDialog } from './partials/LanguagePickerDialog'
import { ThemePickerDialog } from './partials/ThemePickerDialog'
import styles from './App.module.css'

function App() {
  const { t } = useTranslation()
  const { data, isPending, isError, error } = useCruiseResult()
  const fileTreeRef = useRef<FileTreeHandle>(null)
  const graphRef = useRef<DependencyGraphHandle>(null)
  const quickPickRef = useRef<QuickPickHandle>(null)
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false)

  const sources = useMemo(
    () => data?.modules.map((module) => module.source) ?? [],
    [data?.modules],
  )
  const initialDependencyCruiserState = useInitialDependencyCruiserState(sources)
  const orch = useAppOrchestration({ sources, fileTreeRef, graphRef, initialDependencyCruiserState })
  const commands = useAppCommands({
    orch,
    openThemePicker: () => setThemePickerOpen(true),
    openLanguagePicker: () => setLanguagePickerOpen(true),
  })

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
          <AlertTitle>{t('app.loadErrorTitle')}</AlertTitle>
          {error.message}
        </Alert>
      </div>
    )
  }

  const modules: IModule[] = data.modules

  return (
    <AppLayout
      header={
        <AppHeader
          moduleCount={data.summary.totalCruised}
          onOpenFileSearch={() => quickPickRef.current?.openFileMode()}
          onOpenCommandPalette={() => quickPickRef.current?.openCommandMode()}
        />
      }
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
      overlay={
        <>
          <QuickPick
            ref={quickPickRef}
            sources={sources}
            commands={commands}
            onSelectPath={orch.handleQuickPickSelect}
          />
          <ThemePickerDialog
            open={themePickerOpen}
            onClose={() => setThemePickerOpen(false)}
          />
          <LanguagePickerDialog
            open={languagePickerOpen}
            onClose={() => setLanguagePickerOpen(false)}
          />
        </>
      }
      footer={
        <AppStatusBar
          activePath={orch.activePath}
          onFocusActivePath={orch.focusActivePath}
          onShowDependencies={orch.handleShowDependencies}
        />
      }
      panelOpen={orch.panelOpen}
    />
  )
}

export default App
