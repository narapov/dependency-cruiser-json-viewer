import type { QuickPickCommand } from '../../../components/QuickPick'

export interface AppCommandsOrchestration {
  clearLocalStorage: () => void
  focusActivePath: () => void
  copyActive: () => void
  viewActiveDependencies: () => void
  expandActive: () => void
  expandActiveRecursive: () => void
  collapseActive: () => void
  collapseActiveRecursive: () => void
  clearAllHighlights: () => void
  expandAllRecursive: () => void
  collapseAllRecursive: () => void
  selectAll: () => void
  unselectAll: () => void
}

interface UseAppCommandsOptions {
  orch: AppCommandsOrchestration
}

export function useAppCommands({ orch }: UseAppCommandsOptions): QuickPickCommand[] {
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
  } = orch

  return [
    { id: 'clearLocalStorage', label: 'Clear Local Storage', onExecute: clearLocalStorage },
    { id: 'showActive', label: 'Show Active', onExecute: focusActivePath },
    { id: 'copyActive', label: 'Copy Active', onExecute: copyActive },
    {
      id: 'viewActiveDependencies',
      label: 'View Active Dependencies',
      onExecute: viewActiveDependencies,
    },
    { id: 'expandActive', label: 'Expand Active', onExecute: expandActive },
    {
      id: 'expandActiveRecursive',
      label: 'Expand Active Recursive',
      onExecute: expandActiveRecursive,
    },
    { id: 'collapseActive', label: 'Collapse Active', onExecute: collapseActive },
    {
      id: 'collapseActiveRecursive',
      label: 'Collapse Active Recursive',
      onExecute: collapseActiveRecursive,
    },
    {
      id: 'clearAllHighlights',
      label: 'Clear All Highlights',
      onExecute: clearAllHighlights,
    },
    {
      id: 'expandAllRecursive',
      label: 'Expand All Recursive',
      onExecute: expandAllRecursive,
    },
    {
      id: 'collapseAllRecursive',
      label: 'Collapse All Recursive',
      onExecute: collapseAllRecursive,
    },
    { id: 'selectAll', label: 'Select All', onExecute: selectAll },
    { id: 'unselectAll', label: 'Unselect All', onExecute: unselectAll },
  ].sort((a, b) => a.label.localeCompare(b.label))
}
