import { useCallback, useEffect, useRef } from 'react';

import { makeDependencyKey } from '@/domain';
import { getWindowEnvs } from '@/Shared';

import {
  useAppCommands,
  useAppFileLoading,
  useAppOrchestration,
  useCruiseResult,
  useCruiseResultUpdatedNotice,
  useCruiseResultWatch,
} from './hooks';
import { useAboutDialog } from './partials/AboutDialog';
import { AppHeader } from './partials/AppHeader';
import { AppLayout, useSidebarOpen, useSidebarShortcut, useSidebarView, type SidebarView } from './partials/AppLayout';
import { ApplicableRulesPanel } from './partials/ApplicableRulesPanel';
import { AppSidebar } from './partials/AppSidebar';
import { AppStatusBar } from './partials/AppStatusBar';
import { CruiseResultEmptyState } from './partials/CruiseResultEmptyState';
import { CruiseResultLoading } from './partials/CruiseResultLoading';
import { DependencyGraph, useEdgesTypePickerDialog, type DependencyGraphHandle } from './partials/DependencyGraph';
import { DependencyPanel } from './partials/DependencyPanel';
import { type FileTreeHandle } from './partials/FileTree';
import { useHighlightEdgeDialog } from './partials/HighlightEdgeDialog';
import { useIgnorePatternsDialog } from './partials/IgnorePatternsDialog';
import { useCruiseResultJsonDialog, useModuleJsonDialog } from './partials/JsonViewDialog';
import { useLanguagePickerDialog } from './partials/LanguagePickerDialog';
import { QuickPick, type QuickPickHandle } from './partials/QuickPick';
import { useRuleViolationsPickerDialog } from './partials/RuleViolationsPickerDialog';
import { useThemePickerDialog } from './partials/ThemePickerDialog';
import { useWorkspaceStore } from './stores/workspaceStore';

function App() {
  const { data, isPending, isError, error } = useCruiseResult();
  const cruiseResult = useWorkspaceStore(state => state.cruiseResult);
  const resetWorkspace = useWorkspaceStore(state => state.reset);
  const cruiseWatchEnabled = getWindowEnvs()?.watch === true;

  const fileTreeRef = useRef<FileTreeHandle>(null);
  const graphRef = useRef<DependencyGraphHandle>(null);
  const quickPickRef = useRef<QuickPickHandle>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (useWorkspaceStore.getState().cruiseResult) {
      return;
    }
    resetWorkspace(data, 'hard');
  }, [data, resetWorkspace]);

  const isHydrating = data && !cruiseResult;

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

  const fileLoading = useAppFileLoading({
    cruiseWatchEnabled,
    cruiseReady: !!cruiseResult,
  });

  const { notice } = useCruiseResultUpdatedNotice({
    data,
    cruiseWatchEnabled,
  });

  const { showInFileTree, setSelectedPaths, showInGraph, activatePath } = orch;

  const { openThemePicker, themePickerDialog } = useThemePickerDialog();
  const { openLanguagePicker, languagePickerDialog } = useLanguagePickerDialog();
  const { openEdgesTypePicker, edgesTypePickerDialog } = useEdgesTypePickerDialog();
  const { openAbout, aboutDialog } = useAboutDialog();
  const { openIgnorePatterns, ignorePatternsDialog } = useIgnorePatternsDialog();
  const { openRuleViolationsPicker, ruleViolationsPickerDialog } = useRuleViolationsPickerDialog({
    onConfirm: ruleNames => orch.showRuleViolationsOnly(ruleNames),
  });
  const { openHighlightEdge, highlightEdgeDialog } = useHighlightEdgeDialog({
    onConfirm: orch.setUserDependencyHighlight,
  });
  const { openViewCruiseResultJson, cruiseResultJsonDialog } = useCruiseResultJsonDialog();
  const { openModuleJson, moduleJsonDialog } = useModuleJsonDialog();

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
      if (targetPath) {
        activatePath(targetPath);
      }
      if (focusPath) {
        showInGraph(focusPath);
      }
      if (focusPath && targetPath) {
        graphRef.current?.selectEdge(makeDependencyKey(focusPath, targetPath));
      }
    },
    [orch, setSelectedPaths, showInGraph, activatePath],
  );

  const commands = useAppCommands({
    orch,
    openThemePicker,
    openLanguagePicker,
    openEdgesTypePicker,
    openIgnorePatterns,
    openLoadCruiseResult: fileLoading.openLoadCruiseResult,
    openLoadSettings: fileLoading.openLoadSettings,
    openAbout,
    openViewCruiseResultJson,
    openViewActiveModuleJson: () => {
      const activePath = orch.activePath;
      if (activePath) {
        openModuleJson(activePath);
      }
    },
    openRuleViolationsPicker,
    openHighlightEdge,
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
    fileLoadInProgress: fileLoading.isFileLoading,
  });

  if (isPending || isHydrating) {
    return (
      <CruiseResultLoading isDraggingFile={fileLoading.isDraggingFile} isDropAllowed={fileLoading.isDropAllowed} />
    );
  }

  if (isError) {
    return (
      <CruiseResultEmptyState
        error={error}
        cruiseWatchEnabled={cruiseWatchEnabled}
        isFileLoading={fileLoading.isFileLoading}
        fileLoadError={fileLoading.fileLoadError}
        isDraggingFile={fileLoading.isDraggingFile}
        isDropAllowed={fileLoading.isDropAllowed}
        onLoadCruiseResult={fileLoading.openLoadCruiseResult}
        cruiseFileInputRef={fileLoading.cruiseFileInputRef}
        onCruiseFileSelect={fileLoading.handleCruiseFileSelect}
      />
    );
  }

  if (!cruiseResult) {
    return null;
  }

  return (
    <AppLayout
      header={
        <AppHeader
          onOpenFileSearch={() => quickPickRef.current?.openFileMode()}
          onOpenCommandPalette={() => quickPickRef.current?.openCommandMode()}
          onOpenIgnorePatterns={openIgnorePatterns}
          onOpenAbout={openAbout}
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
          {fileLoading.overlay}
          {notice}
          {themePickerDialog}
          {languagePickerDialog}
          {edgesTypePickerDialog}
          {ignorePatternsDialog}
          {ruleViolationsPickerDialog}
          {highlightEdgeDialog}
          {aboutDialog}
          {cruiseResultJsonDialog}
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
      sidebarOpen={sidebarOpen}
      sidebarView={sidebarView}
      onSelectSidebarView={handleSelectSidebarView}
    />
  );
}

export default App;
