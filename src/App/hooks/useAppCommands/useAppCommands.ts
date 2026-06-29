import { useTranslation } from 'react-i18next';

import type { QuickPickCommand } from '../../../components/QuickPick';

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
}

export function useAppCommands({
  orch,
  openThemePicker,
  openLanguagePicker,
  openIgnorePatterns,
  openLoadCruiseResult,
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
    },
    { id: 'unselectAll', label: t('commands.unselectAll'), onExecute: unselectAll },
  ].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}
