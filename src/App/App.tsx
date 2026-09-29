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
  getCruiseSources,
  groupRulesWithViolations,
  makeDependencyKey,
  serializeViewerWorkspace,
  type ViewerWorkspaceSettings,
} from '@/domain';
import { getWindowEnvs } from '@/Shared';

import { CruiseSnapshotProvider } from './contexts';
import {
  useAppCommands,
  useAppOrchestration,
  useCruiseResult,
  useCruiseResultFileDrop,
  useCruiseResultWatch,
  useInitialWorkspaceSettingsFromCli,
  useLoadCruiseResultFromFile,
  useLoadWorkspaceSettingsFromFile,
  useModuleJsonDialog,
  type LoadedCruiseResultFile,
} from './hooks';
import { AboutDialog } from './partials/AboutDialog';
import { AppHeader } from './partials/AppHeader';
import { AppLayout, useSidebarOpen, useSidebarShortcut, useSidebarView, type SidebarView } from './partials/AppLayout';
import { ApplicableRulesPanel } from './partials/ApplicableRulesPanel';
import { AppSidebar } from './partials/AppSidebar';
import { AppStatusBar } from './partials/AppStatusBar';
import { CruiseResultDropOverlay } from './partials/CruiseResultDropOverlay';
import { CruiseResultFileInput } from './partials/CruiseResultFileInput';
import { DependencyGraph, type DependencyGraphHandle } from './partials/DependencyGraph';
import { DependencyPanel } from './partials/DependencyPanel';
import { type FileTreeHandle } from './partials/FileTree';
import { HighlightEdgeDialog } from './partials/HighlightEdgeDialog';
import { IgnorePatternsDialog } from './partials/IgnorePatternsDialog';
import { JsonViewDialog } from './partials/JsonViewDialog';
import { LanguagePickerDialog } from './partials/LanguagePickerDialog';
import { QuickPick, type QuickPickHandle } from './partials/QuickPick';
import { RuleViolationsPickerDialog } from './partials/RuleViolationsPickerDialog';
import { ThemePickerDialog } from './partials/ThemePickerDialog';
import { useWorkspaceStore } from './stores/workspaceStore';

import styles from './App.module.css';

function App() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useCruiseResult();
  const cruiseResult = useWorkspaceStore(state => state.cruiseResult);
  const ignorePatterns = useWorkspaceStore(state => state.ignorePatterns);
  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const dependenciesPanelOpen = useWorkspaceStore(state => state.dependenciesPanelPath != null);
  const applicableRulesPanelOpen = useWorkspaceStore(state => state.applicableRulesPanelPath != null);
  const setIgnorePatterns = useWorkspaceStore(state => state.setIgnorePatterns);
  const resetWorkspace = useWorkspaceStore(state => state.reset);
  const syncWorkspaceSettings = useWorkspaceStore(state => state.syncWorkspaceSettings);
  const [cruiseResultUpdatedOpen, setCruiseResultUpdatedOpen] = useState(false);
  const cruiseWatchEnabled = getWindowEnvs()?.watch === true;

  const fileTreeRef = useRef<FileTreeHandle>(null);
  const graphRef = useRef<DependencyGraphHandle>(null);
  const quickPickRef = useRef<QuickPickHandle>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [ignorePatternsOpen, setIgnorePatternsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [cruiseResultJsonOpen, setCruiseResultJsonOpen] = useState(false);
  const [ruleViolationsPickerOpen, setRuleViolationsPickerOpen] = useState(false);
  const [highlightEdgeOpen, setHighlightEdgeOpen] = useState(false);

  useEffect(() => {
    if (data == null) {
      return;
    }
    if (useWorkspaceStore.getState().cruiseResult != null) {
      return;
    }
    resetWorkspace(data, 'hard');
  }, [data, resetWorkspace]);

  const isHydrating = data != null && cruiseResult == null;

  const ignoredModuleCount = useMemo(
    () => (cruiseResult != null ? countIgnoredModules(cruiseResult, ignorePatterns) : 0),
    [cruiseResult, ignorePatterns],
  );

  const sources = getCruiseSources(cruiseSnapshot);
  const rulesWithViolations = useMemo(
    () =>
      cruiseResult != null
        ? groupRulesWithViolations(cruiseSnapshot.ruleSetUsed, cruiseSnapshot.violations, sources).filter(
            entry => entry.violations.length > 0,
          )
        : [],
    [cruiseResult, cruiseSnapshot.ruleSetUsed, cruiseSnapshot.violations, sources],
  );
  const ruleViolationsPickerOptions = useMemo(
    () =>
      rulesWithViolations.map(entry => ({
        name: entry.name,
        severity: entry.severity,
        violationCount: entry.violations.length,
      })),
    [rulesWithViolations],
  );
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
    onShowHighlightsPanel: () => {
      setSidebarView('highlights');
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
    fileTreeRef,
    graphRef,
  });

  useCruiseResultWatch();

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
    ({ cruiseResult: loadedCruiseResult, settings }: LoadedCruiseResultFile) => {
      const toReset = settings != null ? serializeViewerWorkspace(loadedCruiseResult, settings) : loadedCruiseResult;
      resetWorkspace(toReset, 'hard');
    },
    [resetWorkspace],
  );

  const handleWorkspaceSettingsLoaded = useCallback(
    (settings: ViewerWorkspaceSettings) => {
      if (useWorkspaceStore.getState().cruiseResult == null) {
        return;
      }
      syncWorkspaceSettings(settings);
    },
    [syncWorkspaceSettings],
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

  const { fileLoadError: initialSettingsFileLoadError, clearFileLoadError: clearInitialSettingsFileLoadError } =
    useInitialWorkspaceSettingsFromCli({
      cruiseReady: cruiseResult != null,
      onLoaded: handleWorkspaceSettingsLoaded,
    });

  const isFileLoading = isCruiseFileLoading || isSettingsFileLoading;

  const { isDraggingFile, isDropAllowed } = useCruiseResultFileDrop({
    enabled: !cruiseWatchEnabled && !isFileLoading,
    onFile: file => {
      clearSettingsFileLoadError();
      clearInitialSettingsFileLoadError();
      clearCruiseFileLoadError();
      void handleCruiseFileSelect(file);
    },
    onInvalidFile: () => {
      clearSettingsFileLoadError();
      clearInitialSettingsFileLoadError();
      setCruiseFileLoadError(t('app.dropCruiseResultInvalidFile'));
    },
  });

  const openLoadCruiseResult = () => {
    if (cruiseWatchEnabled || isFileLoading) {
      return;
    }
    clearSettingsFileLoadError();
    clearInitialSettingsFileLoadError();
    openCruiseFilePicker();
  };

  const openLoadSettings = () => {
    if (isFileLoading) {
      return;
    }
    clearCruiseFileLoadError();
    clearInitialSettingsFileLoadError();
    openSettingsFilePicker();
  };

  const fileLoadError = cruiseFileLoadError ?? settingsFileLoadError ?? initialSettingsFileLoadError;
  const clearFileLoadError = () => {
    clearCruiseFileLoadError();
    clearSettingsFileLoadError();
    clearInitialSettingsFileLoadError();
  };

  const { showInFileTree, setSelectedPaths, showInGraph, activatePath } = orch;

  const { openModuleJson, moduleJsonDialog } = useModuleJsonDialog(cruiseResult?.modules ?? []);

  const handleShowInFileTree = useCallback(
    (path: string) => {
      setSidebarView('files');
      setSidebarOpen(true);
      showInFileTree(path);
    },
    [showInFileTree, setSidebarOpen, setSidebarView],
  );

  const handleShowDependencyConnection = useCallback(
    (paths: string[]) => {
      const selectedPaths = orch.selectedPaths;
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
    [orch, setSelectedPaths, showInGraph, activatePath],
  );

  const commands = useAppCommands({
    orch,
    openThemePicker: () => setThemePickerOpen(true),
    openLanguagePicker: () => setLanguagePickerOpen(true),
    openIgnorePatterns: () => setIgnorePatternsOpen(true),
    openLoadCruiseResult,
    openLoadSettings,
    openAbout: () => setAboutOpen(true),
    openViewCruiseResultJson: () => setCruiseResultJsonOpen(true),
    openViewActiveModuleJson: () => {
      const activePath = orch.activePath;
      if (activePath != null) {
        openModuleJson(activePath);
      }
    },
    openRuleViolationsPicker: () => setRuleViolationsPickerOpen(true),
    openHighlightEdge: () => setHighlightEdgeOpen(true),
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
    showHighlightsPanel: () => {
      setSidebarView('highlights');
      setSidebarOpen(true);
    },
    toggleSidebar: toggleSidebarOpen,
    fileLoadInProgress: isFileLoading,
    cruiseWatchEnabled,
    hasCruiseResult: cruiseResult != null,
    hasRuleViolations: rulesWithViolations.length > 0,
  });

  if (isPending || isHydrating) {
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

  if (cruiseResult == null) {
    return null;
  }

  const totalModulesCount = cruiseResult.modules.length;
  const filteredModulesCount = sources.length;

  return (
    <CruiseSnapshotProvider value={cruiseSnapshot}>
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
            onShowInGraph={orch.showInGraph}
            onViewModuleJson={openModuleJson}
            onSelectViolationPaths={handleShowDependencyConnection}
            onShowRuleViolations={ruleName => orch.showRuleViolationsOnly([ruleName])}
            onShowCycle={orch.showPathsOnly}
            onRemoveHighlightKeys={keys => orch.setUserDependencyHighlight(keys, null)}
            onShowHighlightConnection={(source, target) => handleShowDependencyConnection([source, target])}
            onClearAllHighlights={orch.clearAllHighlights}
          />
        }
        main={
          <DependencyGraph ref={graphRef} onShowInFileTree={handleShowInFileTree} onViewModuleJson={openModuleJson} />
        }
        dependenciesPanel={
          <DependencyPanel
            onClose={orch.handleClosePanel}
            onShowInGraph={orch.showInGraph}
            onViewModuleJson={openModuleJson}
          />
        }
        applicableRulesPanel={
          <ApplicableRulesPanel
            onClose={orch.handleCloseApplicableRulesPanel}
            onShowInGraph={orch.showInGraph}
            onSelectViolationPaths={handleShowDependencyConnection}
          />
        }
        overlay={
          <>
            <QuickPick ref={quickPickRef} commands={commands} onSelectPath={orch.handleQuickPickSelect} />
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
              patterns={ignorePatterns}
              onClose={() => setIgnorePatternsOpen(false)}
              onSave={setIgnorePatterns}
            />
            <RuleViolationsPickerDialog
              open={ruleViolationsPickerOpen}
              rules={ruleViolationsPickerOptions}
              onClose={() => setRuleViolationsPickerOpen(false)}
              onConfirm={ruleNames => orch.showRuleViolationsOnly(ruleNames)}
            />
            <HighlightEdgeDialog
              open={highlightEdgeOpen}
              onConfirm={orch.setUserDependencyHighlight}
              onClose={() => setHighlightEdgeOpen(false)}
            />
            <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
            <JsonViewDialog
              open={cruiseResultJsonOpen}
              title={t('cruiseResultJson.title')}
              data={cruiseResult}
              onClose={() => setCruiseResultJsonOpen(false)}
              shouldExpandNode={level => level < 4}
              fullScreen
            />
            {moduleJsonDialog}
          </>
        }
        footer={
          <AppStatusBar
            onFocusActivePath={orch.focusActivePath}
            onShowDependenciesPanel={orch.handleShowDependenciesPanel}
            onShowApplicableRulesPanel={orch.handleShowApplicableRulesPanel}
            onViewModuleJson={openModuleJson}
          />
        }
        dependenciesPanelOpen={dependenciesPanelOpen}
        applicableRulesPanelOpen={applicableRulesPanelOpen}
        sidebarOpen={sidebarOpen}
        sidebarView={sidebarView}
        onSelectSidebarView={handleSelectSidebarView}
      />
    </CruiseSnapshotProvider>
  );
}

export default App;
