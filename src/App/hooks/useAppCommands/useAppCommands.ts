import { useTranslation } from 'react-i18next';

import type { QuickPickCommand } from '../../partials/QuickPick';

export interface AppCommandsOrchestration {
  clearLocalStorage: () => void;
  focusActivePath: () => void;
  copyActive: () => void;
  viewActiveDependencies: () => void;
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
}

interface UseAppCommandsOptions {
  orch: AppCommandsOrchestration;
  openThemePicker: () => void;
  openLanguagePicker: () => void;
  openIgnorePatterns: () => void;
  openLoadCruiseResult: () => void;
  openLoadSettings: () => void;
  openAbout: () => void;
  toggleFileTree: () => void;
  fileLoadInProgress?: boolean;
}

export function useAppCommands({
  orch,
  openThemePicker,
  openLanguagePicker,
  openIgnorePatterns,
  openLoadCruiseResult,
  openLoadSettings,
  openAbout,
  toggleFileTree,
  fileLoadInProgress = false,
}: UseAppCommandsOptions): QuickPickCommand[] {
  const { t } = useTranslation();
  const {
    clearLocalStorage,
    focusActivePath,
    copyActive,
    viewActiveDependencies,
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
  } = orch;

  return [
    { id: 'clearLocalStorage', label: t('commands.clearLocalStorage'), onExecute: clearLocalStorage },
    { id: 'showActive', label: t('commands.showActive'), onExecute: focusActivePath },
    { id: 'copyActive', label: t('commands.copyActive'), onExecute: copyActive },
    {
      id: 'viewActiveDependencies',
      label: t('commands.viewActiveDependencies'),
      onExecute: viewActiveDependencies,
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
    { id: 'setTheme', label: t('commands.setTheme'), onExecute: openThemePicker },
    { id: 'setLanguage', label: t('commands.setLanguage'), onExecute: openLanguagePicker },
    {
      id: 'setIgnorePatterns',
      label: t('commands.setIgnorePatterns'),
      onExecute: openIgnorePatterns,
    },
    {
      id: 'loadCruiseResult',
      label: t('commands.loadCruiseResult'),
      onExecute: openLoadCruiseResult,
      disabled: fileLoadInProgress,
    },
    {
      id: 'loadWorkspaceSettings',
      label: t('commands.loadWorkspaceSettings'),
      onExecute: openLoadSettings,
      disabled: fileLoadInProgress,
    },
    { id: 'about', label: t('commands.about'), onExecute: openAbout },
    { id: 'toggleFileTree', label: t('commands.toggleFileTree'), onExecute: toggleFileTree },
    { id: 'unselectAll', label: t('commands.unselectAll'), onExecute: unselectAll },
  ].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}
