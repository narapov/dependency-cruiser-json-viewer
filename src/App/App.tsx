import type { IModule } from 'dependency-cruiser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';

import {
  countIgnoredModules,
  CruiseResultParseError,
  filterCruiseResult,
  makeDependencyKey,
  type ViewerWorkspaceSettings,
} from '@/domain';
import { getWindowEnvs } from '@/Shared';

import { resolveWorkspaceApply } from './helpers';
import {
  useAppCommands,
  useAppOrchestration,
  useCruiseResult,
  useCruiseResultFileDrop,
  useCruiseResultWatch,
  useIgnorePatterns,
  useInitialDependencyCruiserState,
  useLoadCruiseResultFromFile,
  useLoadWorkspaceSettingsFromFile,
  type LoadedCruiseResultFile,
} from './hooks';
import { AboutDialog } from './partials/AboutDialog';
import { AppHeader } from './partials/AppHeader';
import { AppLayout, useSidebarOpen, useSidebarShortcut, useSidebarView, type SidebarView } from './partials/AppLayout';
import { AppSidebar } from './partials/AppSidebar';
import { AppStatusBar } from './partials/AppStatusBar';
import { CruiseResultDropOverlay } from './partials/CruiseResultDropOverlay';
import { CruiseResultFileInput } from './partials/CruiseResultFileInput';
import { DependencyGraph, type DependencyGraphHandle } from './partials/DependencyGraph';
import { DependencyPanel } from './partials/DependencyPanel';
import { type FileTreeHandle } from './partials/FileTree';
import { IgnorePatternsDialog } from './partials/IgnorePatternsDialog';
import { LanguagePickerDialog } from './partials/LanguagePickerDialog';
import { QuickPick, type QuickPickHandle } from './partials/QuickPick';
import { ThemePickerDialog } from './partials/ThemePickerDialog';

import styles from './App.module.css';

function App() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useCruiseResult();
  const { patterns, setPatterns } = useIgnorePatterns();
  const [cruiseLoadId, setCruiseLoadId] = useState(0);
  const [cruiseResultUpdatedOpen, setCruiseResultUpdatedOpen] = useState(false);
  const cruiseWatchEnabled = getWindowEnvs()?.watch === true;

  const fileTreeRef = useRef<FileTreeHandle>(null);
  const graphRef = useRef<DependencyGraphHandle>(null);
  const quickPickRef = useRef<QuickPickHandle>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [ignorePatternsOpen, setIgnorePatternsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const filteredData = useMemo(() => (data ? filterCruiseResult(data, patterns) : undefined), [data, patterns]);

  const ignoredModuleCount = useMemo(() => (data ? countIgnoredModules(data, patterns) : 0), [data, patterns]);

  const sources = useMemo(() => filteredData?.modules.map(module => module.source) ?? [], [filteredData?.modules]);
  const modules: IModule[] = filteredData?.modules ?? [];
  const initialDependencyCruiserState = useInitialDependencyCruiserState(sources);
  const { sidebarOpen, setSidebarOpen, toggleSidebarOpen } = useSidebarOpen();
  const { sidebarView, setSidebarView } = useSidebarView();
  useSidebarShortcut({
    onToggle: toggleSidebarOpen,
    onShowFileTree: () => {
      setSidebarView('files');
      setSidebarOpen(true);
    },
    onShowRulesPanel: () => {
      setSidebarView('rules');
      setSidebarOpen(true);
    },
    onShowCircularPanel: () => {
      setSidebarView('circular');
      setSidebarOpen(true);
    },
  });

  const handleSelectSidebarView = useCallback(
    (view: SidebarView) => {
      if (sidebarOpen && sidebarView === view) {
        toggleSidebarOpen();
        return;
      }
      setSidebarView(view);
      setSidebarOpen(true);
    },
    [sidebarOpen, sidebarView, toggleSidebarOpen, setSidebarView, setSidebarOpen],
  );

  const orch = useAppOrchestration({
    sources,
    unfilteredCruiseResult: data,
    ignorePatterns: patterns,
    fileTreeRef,
    graphRef,
    initialDependencyCruiserState,
    cruiseLoadId,
  });

  useCruiseResultWatch({
    cruiseLoadId,
    setCruiseLoadId,
    setPatterns,
    getCurrentWorkspaceSettings: orch.getCurrentWorkspaceSettings,
    applyWorkspaceView: orch.applyWorkspaceView,
  });

  const isInitialCruiseResult = useRef(true);
  useEffect(() => {
    if (!cruiseWatchEnabled || data == null) {
      return;
    }
    if (isInitialCruiseResult.current) {
      isInitialCruiseResult.current = false;
      return;
    }
    setCruiseResultUpdatedOpen(true);
  }, [data, cruiseWatchEnabled]);

  const handleCruiseLoaded = useCallback(
    ({ cruiseResult, settings }: LoadedCruiseResultFile) => {
      const nextCruiseLoadId = cruiseLoadId + 1;
      setCruiseLoadId(nextCruiseLoadId);
      if (settings) {
        setPatterns(settings.ignorePatterns);
        const { sourcesKey, view, lastInitialSelectedKeys, lastInitialExpandedKeys } = resolveWorkspaceApply({
          cruiseResult,
          settings,
        });
        orch.applyWorkspaceView({
          view,
          sourcesKey,
          cruiseLoadId: nextCruiseLoadId,
          lastInitialSelectedKeys,
          lastInitialExpandedKeys,
        });
      } else {
        setPatterns([]);
      }
    },
    [cruiseLoadId, setPatterns, orch],
  );

  const handleWorkspaceSettingsLoaded = useCallback(
    (settings: ViewerWorkspaceSettings) => {
      if (data == null) {
        return;
      }
      setPatterns(settings.ignorePatterns);
      const { sourcesKey, view, lastInitialSelectedKeys, lastInitialExpandedKeys } = resolveWorkspaceApply({
        cruiseResult: data,
        settings,
      });
      orch.applyWorkspaceView({
        view,
        sourcesKey,
        cruiseLoadId,
        lastInitialSelectedKeys,
        lastInitialExpandedKeys,
      });
    },
    [data, cruiseLoadId, setPatterns, orch],
  );

  const {
    fileInputRef: cruiseFileInputRef,
    openFilePicker: openCruiseFilePicker,
    handleFileSelect: handleCruiseFileSelect,
    isLoading: isCruiseFileLoading,
    fileLoadError: cruiseFileLoadError,
    setFileLoadError: setCruiseFileLoadError,
    clearFileLoadError: clearCruiseFileLoadError,
  } = useLoadCruiseResultFromFile({ onLoaded: handleCruiseLoaded });

  const {
    fileInputRef: settingsFileInputRef,
    openFilePicker: openSettingsFilePicker,
    handleFileSelect: handleSettingsFileSelect,
    isLoading: isSettingsFileLoading,
    fileLoadError: settingsFileLoadError,
    clearFileLoadError: clearSettingsFileLoadError,
  } = useLoadWorkspaceSettingsFromFile({ onLoaded: handleWorkspaceSettingsLoaded });

  const isFileLoading = isCruiseFileLoading || isSettingsFileLoading;

  const { isDraggingFile, isDropAllowed } = useCruiseResultFileDrop({
    enabled: !cruiseWatchEnabled && !isFileLoading,
    onFile: file => {
      clearSettingsFileLoadError();
      clearCruiseFileLoadError();
      void handleCruiseFileSelect(file);
    },
    onInvalidFile: () => {
      clearSettingsFileLoadError();
      setCruiseFileLoadError(t('app.dropCruiseResultInvalidFile'));
    },
  });

  const openLoadCruiseResult = () => {
    if (cruiseWatchEnabled || isFileLoading) {
      return;
    }
    clearSettingsFileLoadError();
    openCruiseFilePicker();
  };

  const openLoadSettings = () => {
    if (isFileLoading) {
      return;
    }
    clearCruiseFileLoadError();
    openSettingsFilePicker();
  };

  const fileLoadError = cruiseFileLoadError ?? settingsFileLoadError;
  const clearFileLoadError = () => {
    clearCruiseFileLoadError();
    clearSettingsFileLoadError();
  };

  const { showInFileTree, setSelectedPaths, selectedPaths, showInGraph, activatePath } = orch;

  const handleShowInFileTree = useCallback(
    (path: string) => {
      setSidebarView('files');
      setSidebarOpen(true);
      showInFileTree(path);
    },
    [showInFileTree, setSidebarOpen, setSidebarView],
  );

  const handleSelectViolationPaths = useCallback(
    (paths: string[]) => {
      const nextPaths = paths.filter(path => !selectedPaths.includes(path));
      if (nextPaths.length > 0) {
        setSelectedPaths([...selectedPaths, ...nextPaths]);
      }
      const focusPath = paths[0];
      const targetPath = paths[1];
      // Expand both ends so the graph edge id is file→file (not collapsed folder reps).
      if (targetPath != null) {
        activatePath(targetPath);
      }
      if (focusPath != null) {
        showInGraph(focusPath);
      }
      if (focusPath != null && targetPath != null) {
        graphRef.current?.selectEdge(makeDependencyKey(focusPath, targetPath));
      }
    },
    [selectedPaths, setSelectedPaths, showInGraph, activatePath],
  );

  const commands = useAppCommands({
    orch,
    openThemePicker: () => setThemePickerOpen(true),
    openLanguagePicker: () => setLanguagePickerOpen(true),
    openIgnorePatterns: () => setIgnorePatternsOpen(true),
    openLoadCruiseResult,
    openLoadSettings,
    openAbout: () => setAboutOpen(true),
    showFileTree: () => {
      setSidebarView('files');
      setSidebarOpen(true);
    },
    showRulesPanel: () => {
      setSidebarView('rules');
      setSidebarOpen(true);
    },
    showCircularPanel: () => {
      setSidebarView('circular');
      setSidebarOpen(true);
    },
    toggleSidebar: toggleSidebarOpen,
    fileLoadInProgress: isFileLoading,
    cruiseWatchEnabled,
  });

  if (isPending) {
    return (
      <div className={styles.centered}>
        <CircularProgress size={32} />
        <CruiseResultDropOverlay open={isDraggingFile} allowed={isDropAllowed} />
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
          {!cruiseWatchEnabled &&
            (isFileLoading ? (
              <CircularProgress size={32} />
            ) : (
              <Button variant="contained" onClick={openLoadCruiseResult} disabled={isFileLoading}>
                {t('app.loadCruiseResult')}
              </Button>
            ))}
          {!cruiseWatchEnabled && (
            <CruiseResultFileInput ref={cruiseFileInputRef} onFileSelect={handleCruiseFileSelect} />
          )}
        </Stack>
        <CruiseResultDropOverlay open={isDraggingFile} allowed={isDropAllowed} />
      </div>
    );
  }

  const totalModulesCount = data.modules.length;
  const filteredModulesCount = modules.length;

  return (
    <AppLayout
      header={
        <AppHeader
          filteredModulesCount={filteredModulesCount}
          totalModulesCount={totalModulesCount}
          hasIgnoredModules={ignoredModuleCount > 0}
          watchMode={cruiseWatchEnabled}
          onOpenFileSearch={() => quickPickRef.current?.openFileMode()}
          onOpenCommandPalette={() => quickPickRef.current?.openCommandMode()}
          onOpenIgnorePatterns={() => setIgnorePatternsOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
        />
      }
      sidebar={
        <AppSidebar
          view={sidebarView}
          fileTreeRef={fileTreeRef}
          sources={sources}
          selectedKeys={orch.selectedPaths}
          onSelect={orch.setSelectedPaths}
          expandedKeys={orch.expandedKeys}
          onExpand={orch.updateExpandedKeys}
          onExpandRecursive={orch.expandRecursive}
          onShowInGraph={orch.showInGraph}
          onShowDependencies={orch.handleShowDependencies}
          activePath={orch.activePath}
          ruleSetUsed={data.summary.ruleSetUsed}
          violations={data.summary.violations}
          onSelectViolationPaths={handleSelectViolationPaths}
          modules={modules}
          onShowCycle={orch.showPathsOnly}
        />
      }
      main={
        <DependencyGraph
          ref={graphRef}
          modules={modules}
          selectedPaths={orch.selectedPaths}
          expandedKeys={orch.expandedKeys}
          folderBaseColors={orch.folderBaseColors}
          onToggleFolder={orch.toggleFolder}
          onExpandRecursive={orch.expandRecursive}
          onShowInFileTree={handleShowInFileTree}
          onShowDependencies={orch.handleShowDependencies}
          onActivePathChange={orch.activatePath}
          activePath={orch.activePath}
          userEdgeHighlights={orch.userEdgeHighlights}
          onUserEdgeHighlightsChange={orch.setUserEdgeHighlights}
          onClearAllHighlights={orch.clearAllHighlights}
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
            userEdgeHighlights={orch.userEdgeHighlights}
            onSetUserDependencyHighlight={orch.setUserDependencyHighlight}
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
          {!cruiseWatchEnabled && (
            <CruiseResultFileInput ref={cruiseFileInputRef} onFileSelect={handleCruiseFileSelect} />
          )}
          <CruiseResultFileInput ref={settingsFileInputRef} onFileSelect={handleSettingsFileSelect} />
          {isFileLoading && (
            <div className={styles.fileLoadOverlay}>
              <CircularProgress size={32} />
            </div>
          )}
          <CruiseResultDropOverlay open={isDraggingFile} allowed={isDropAllowed} />
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
          <Snackbar
            open={cruiseResultUpdatedOpen}
            autoHideDuration={4000}
            onClose={() => setCruiseResultUpdatedOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="success" onClose={() => setCruiseResultUpdatedOpen(false)} sx={{ width: '100%' }}>
              {t('app.cruiseResultUpdated')}
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
          <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
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
      sidebarOpen={sidebarOpen}
      sidebarView={sidebarView}
      onSelectSidebarView={handleSelectSidebarView}
    />
  );
}

export default App;
