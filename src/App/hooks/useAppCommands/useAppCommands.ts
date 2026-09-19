import { useTranslation } from 'react-i18next';

import type { QuickPickCommand } from '../../partials/QuickPick';

export interface AppCommandsOrchestration {
  clearLocalStorage: () => void;
  focusActivePath: () => void;
  copyActive: () => void;
  viewActiveItemDependenciesPanel: () => void;
  viewActiveItemApplicableRulesPanel: () => void;
  expandActive: () => void;
  expandActiveRecursive: () => void;
  collapseActive: () => void;
  collapseActiveRecursive: () => void;
  clearAllHighlights: () => void;
  exportGraphDot: () => void;
  viewGraphDotOnline: () => void;
  saveWorkspace: () => void;
  expandAllRecursive: () => void;
  collapseAllRecursive: () => void;
  selectAll: () => void;
  unselectAll: () => void;
  showCircularDependenciesOnly: () => void;
}

interface UseAppCommandsOptions {
  orch: AppCommandsOrchestration;
  openThemePicker: () => void;
  openLanguagePicker: () => void;
  openIgnorePatterns: () => void;
  openLoadCruiseResult: () => void;
  openLoadSettings: () => void;
  openAbout: () => void;
  openViewCruiseResultJson: () => void;
  openViewActiveModuleJson: () => void;
  openRuleViolationsPicker: () => void;
  showFileTree: () => void;
  showRulesPanel: () => void;
  showCircularPanel: () => void;
  showHighlightsPanel: () => void;
  toggleSidebar: () => void;
  fileLoadInProgress?: boolean;
  cruiseWatchEnabled?: boolean;
  hasCruiseResult?: boolean;
  hasRuleViolations?: boolean;
}

export function useAppCommands(config: UseAppCommandsOptions): QuickPickCommand[] {
  const {
    orch: {
      clearLocalStorage,
      focusActivePath,
      copyActive,
      viewActiveItemDependenciesPanel,
      viewActiveItemApplicableRulesPanel,
      expandActive,
      expandActiveRecursive,
      collapseActive,
      collapseActiveRecursive,
      clearAllHighlights,
      exportGraphDot,
      viewGraphDotOnline,
      saveWorkspace,
      expandAllRecursive,
      collapseAllRecursive,
      selectAll,
      unselectAll,
      showCircularDependenciesOnly,
    },
    openThemePicker,
    openLanguagePicker,
    openIgnorePatterns,
    openLoadCruiseResult,
    openLoadSettings,
    openAbout,
    openViewCruiseResultJson,
    openViewActiveModuleJson,
    openRuleViolationsPicker,
    showFileTree,
    showRulesPanel,
    showCircularPanel,
    showHighlightsPanel,
    toggleSidebar,
    fileLoadInProgress = false,
    cruiseWatchEnabled = false,
    hasCruiseResult = false,
    hasRuleViolations = false,
  } = config;

  const { t } = useTranslation();

  const commands: QuickPickCommand[] = [
    { id: 'clearLocalStorage', label: t('commands.clearLocalStorage'), onExecute: clearLocalStorage },
    { id: 'showActive', label: t('commands.showActive'), onExecute: focusActivePath },
    { id: 'copyActive', label: t('commands.copyActive'), onExecute: copyActive },
    {
      id: 'viewActiveItemDependenciesPanel',
      label: t('commands.viewActiveItemDependenciesPanel'),
      onExecute: viewActiveItemDependenciesPanel,
    },
    {
      id: 'viewActiveItemApplicableRulesPanel',
      label: t('commands.viewActiveItemApplicableRulesPanel'),
      onExecute: viewActiveItemApplicableRulesPanel,
    },
    {
      id: 'viewActiveItemModuleJson',
      label: t('commands.viewActiveItemModuleJson'),
      onExecute: openViewActiveModuleJson,
    },
    { id: 'expandActive', label: t('commands.expandActive'), onExecute: expandActive },
    {
      id: 'expandActiveRecursive',
      label: t('commands.expandActiveRecursive'),
      onExecute: expandActiveRecursive,
    },
    { id: 'collapseActive', label: t('commands.collapseActive'), onExecute: collapseActive },
    {
      id: 'collapseActiveRecursive',
      label: t('commands.collapseActiveRecursive'),
      onExecute: collapseActiveRecursive,
    },
    {
      id: 'clearAllHighlights',
      label: t('commands.clearAllHighlights'),
      onExecute: clearAllHighlights,
    },
    {
      id: 'exportGraphDot',
      label: t('commands.exportGraphDot'),
      onExecute: exportGraphDot,
    },
    {
      id: 'viewGraphDotOnline',
      label: t('commands.viewGraphDotOnline'),
      onExecute: viewGraphDotOnline,
    },
    {
      id: 'saveWorkspace',
      label: t('commands.saveWorkspace'),
      onExecute: saveWorkspace,
    },
    {
      id: 'expandAllRecursive',
      label: t('commands.expandAllRecursive'),
      onExecute: expandAllRecursive,
    },
    {
      id: 'collapseAllRecursive',
      label: t('commands.collapseAllRecursive'),
      onExecute: collapseAllRecursive,
    },
    { id: 'selectAll', label: t('commands.selectAll'), onExecute: selectAll },
    {
      id: 'showCircularDependenciesOnly',
      label: t('commands.showCircularDependenciesOnly'),
      onExecute: showCircularDependenciesOnly,
    },
    {
      id: 'showRuleViolationsOnly',
      label: t('commands.showRuleViolationsOnly'),
      onExecute: openRuleViolationsPicker,
      disabled: !hasCruiseResult || !hasRuleViolations,
    },
    { id: 'setTheme', label: t('commands.setTheme'), onExecute: openThemePicker },
    { id: 'setLanguage', label: t('commands.setLanguage'), onExecute: openLanguagePicker },
    {
      id: 'setIgnorePatterns',
      label: t('commands.setIgnorePatterns'),
      onExecute: openIgnorePatterns,
    },
    {
      id: 'loadWorkspaceSettings',
      label: t('commands.loadWorkspaceSettings'),
      onExecute: openLoadSettings,
      disabled: fileLoadInProgress,
    },
    { id: 'about', label: t('commands.about'), onExecute: openAbout },
    {
      id: 'viewCruiseResultJson',
      label: t('commands.viewCruiseResultJson'),
      onExecute: openViewCruiseResultJson,
      disabled: !hasCruiseResult,
    },
    { id: 'showFileTree', label: t('commands.showFileTree'), onExecute: showFileTree },
    { id: 'showRulesPanel', label: t('commands.showRulesPanel'), onExecute: showRulesPanel },
    { id: 'showCircularPanel', label: t('commands.showCircularPanel'), onExecute: showCircularPanel },
    {
      id: 'showHighlightsPanel',
      label: t('commands.showHighlightsPanel'),
      onExecute: showHighlightsPanel,
    },
    { id: 'toggleSidebar', label: t('commands.toggleSidebar'), onExecute: toggleSidebar },
    { id: 'unselectAll', label: t('commands.unselectAll'), onExecute: unselectAll },
  ];

  if (!cruiseWatchEnabled) {
    commands.push({
      id: 'loadCruiseResult',
      label: t('commands.loadCruiseResult'),
      onExecute: openLoadCruiseResult,
      disabled: fileLoadInProgress,
    });
  }

  return commands.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}
