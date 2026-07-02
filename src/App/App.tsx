import type { IModule } from 'dependency-cruiser';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';

import { countIgnoredModules, CruiseResultParseError, filterCruiseResult } from '@/domain';

import { AppLayout } from '../components/AppLayout';
import { DependencyGraph, type DependencyGraphHandle } from '../components/DependencyGraph';
import { DependencyPanel } from '../components/DependencyPanel';
import { FileTree, type FileTreeHandle } from '../components/FileTree';
import { QuickPick, type QuickPickHandle } from '../components/QuickPick';
import {
  useAppCommands,
  useAppOrchestration,
  useCruiseResult,
  useIgnorePatterns,
  useInitialDependencyCruiserState,
  useLoadCruiseResultFromFile,
} from './hooks';
import { AppHeader } from './partials/AppHeader';
import { AppStatusBar } from './partials/AppStatusBar';
import { CruiseResultFileInput } from './partials/CruiseResultFileInput';
import { IgnorePatternsDialog } from './partials/IgnorePatternsDialog';
import { LanguagePickerDialog } from './partials/LanguagePickerDialog';
import { ThemePickerDialog } from './partials/ThemePickerDialog';

import styles from './App.module.css';

function App() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useCruiseResult();
  const { fileInputRef, openFilePicker, handleFileSelect, fileLoadError, clearFileLoadError } =
    useLoadCruiseResultFromFile();
  const { patterns, setPatterns } = useIgnorePatterns();
  const fileTreeRef = useRef<FileTreeHandle>(null);
  const graphRef = useRef<DependencyGraphHandle>(null);
  const quickPickRef = useRef<QuickPickHandle>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [ignorePatternsOpen, setIgnorePatternsOpen] = useState(false);

  const filteredData = useMemo(() => (data ? filterCruiseResult(data, patterns) : undefined), [data, patterns]);

  const ignoredModuleCount = useMemo(() => (data ? countIgnoredModules(data, patterns) : 0), [data, patterns]);

  const sources = useMemo(() => filteredData?.modules.map(module => module.source) ?? [], [filteredData?.modules]);
  const initialDependencyCruiserState = useInitialDependencyCruiserState(sources);
  const orch = useAppOrchestration({ sources, fileTreeRef, graphRef, initialDependencyCruiserState });
  const commands = useAppCommands({
    orch,
    openThemePicker: () => setThemePickerOpen(true),
    openLanguagePicker: () => setLanguagePickerOpen(true),
    openIgnorePatterns: () => setIgnorePatternsOpen(true),
    openLoadCruiseResult: openFilePicker,
  });

  if (isPending) {
    return (
      <div className={styles.centered}>
        <CircularProgress size={32} />
      </div>
    );
  }

  if (isError) {
    const apiParseError = error instanceof CruiseResultParseError ? t('app.invalidCruiseResultFormat') : null;

    return (
      <div className={styles.centered}>
        <Stack spacing={2} sx={{ maxWidth: 480, px: 2, alignItems: 'center' }}>
          {apiParseError ? (
            <Alert severity="error" sx={{ width: '100%' }}>
              {apiParseError}
            </Alert>
          ) : (
            <Alert severity="info" sx={{ width: '100%' }}>
              <AlertTitle>{t('app.noCruiseResultTitle')}</AlertTitle>
              {t('app.noCruiseResultMessage')}
            </Alert>
          )}
          {fileLoadError && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {fileLoadError}
            </Alert>
          )}
          <Button variant="contained" onClick={openFilePicker}>
            {t('app.loadCruiseResult')}
          </Button>
          <CruiseResultFileInput ref={fileInputRef} onFileSelect={handleFileSelect} />
        </Stack>
      </div>
    );
  }

  const modules: IModule[] = filteredData!.modules;
  const totalModulesCount = data.modules.length;
  const filteredModulesCount = modules.length;

  return (
    <AppLayout
      header={
        <AppHeader
          filteredModulesCount={filteredModulesCount}
          totalModulesCount={totalModulesCount}
          hasIgnoredModules={ignoredModuleCount > 0}
          onOpenFileSearch={() => quickPickRef.current?.openFileMode()}
          onOpenCommandPalette={() => quickPickRef.current?.openCommandMode()}
          onOpenIgnorePatterns={() => setIgnorePatternsOpen(true)}
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
          <CruiseResultFileInput ref={fileInputRef} onFileSelect={handleFileSelect} />
          <Snackbar
            open={Boolean(fileLoadError)}
            autoHideDuration={6000}
            onClose={clearFileLoadError}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={clearFileLoadError} sx={{ width: '100%' }}>
              {fileLoadError}
            </Alert>
          </Snackbar>
          <ThemePickerDialog open={themePickerOpen} onClose={() => setThemePickerOpen(false)} />
          <LanguagePickerDialog open={languagePickerOpen} onClose={() => setLanguagePickerOpen(false)} />
          <IgnorePatternsDialog
            open={ignorePatternsOpen}
            patterns={patterns}
            onClose={() => setIgnorePatternsOpen(false)}
            onSave={setPatterns}
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
  );
}

export default App;
