import { useTranslation } from 'react-i18next';

import {
  collectRelatedModuleSources,
  getCruiseModules,
  getDependencyKeysBetweenPaths,
  getEdgeHighlightColor,
} from '@/domain';
import { AppDialog, AppDialogContent, AppDialogTitle } from '@/Shared';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { PathSearchBody } from '../PathSearchDialog';
import { expandPathsWithAncestors } from './helpers';
import { useHighlightEdgeDialogState } from './hooks/useHighlightEdgeDialogState';
import { HighlightEdgeColorStep } from './partials';

interface HighlightEdgeDialogProps {
  open: boolean;
  onConfirm: (dependencyKeys: readonly string[], color: string | null) => void;
  onClose: () => void;
}

function titleKeyForStep(step: 'source' | 'target' | 'color'): string {
  if (step === 'source') {
    return 'highlightEdge.selectSource';
  }
  if (step === 'target') {
    return 'highlightEdge.selectTarget';
  }
  return 'highlightEdge.selectColor';
}

interface HighlightEdgeDialogContentProps {
  onConfirm: (dependencyKeys: readonly string[], color: string | null) => void;
  onClose: () => void;
}

function HighlightEdgeDialogContent(props: HighlightEdgeDialogContentProps) {
  const { onConfirm, onClose } = props;

  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const userEdgeHighlights = useWorkspaceStore(state => state.userEdgeHighlights);
  const { t } = useTranslation();
  const { step, sourcePath, targetPath, selectSource, selectTarget } = useHighlightEdgeDialogState();

  const modules = getCruiseModules(cruiseSnapshot);
  const targetSources = sourcePath != null ? collectRelatedModuleSources(sourcePath, modules, 'dependencies') : [];
  const targetAllowedPaths = expandPathsWithAncestors(targetSources, cruiseSnapshot);

  const dependencyKeys =
    sourcePath != null && targetPath != null
      ? getDependencyKeysBetweenPaths(sourcePath, targetPath, 'dependencies', modules)
      : [];

  const currentHighlight =
    dependencyKeys.length > 0 ? getEdgeHighlightColor(dependencyKeys, userEdgeHighlights) : undefined;

  const handleColorSelect = (color: string | null) => {
    if (dependencyKeys.length === 0) {
      return;
    }
    onConfirm(dependencyKeys, color);
    onClose();
  };

  return (
    <>
      <AppDialogTitle>{t(titleKeyForStep(step))}</AppDialogTitle>
      <AppDialogContent sx={{ p: 0 }}>
        {step === 'source' && <PathSearchBody onSelect={selectSource} />}
        {step === 'target' && <PathSearchBody allowedPaths={targetAllowedPaths} onSelect={selectTarget} />}
        {step === 'color' && (
          <HighlightEdgeColorStep currentHighlight={currentHighlight} onSelect={handleColorSelect} />
        )}
      </AppDialogContent>
    </>
  );
}

/** Multi-step dialog to pick source, target, and color for an edge highlight. */
export function HighlightEdgeDialog(props: HighlightEdgeDialogProps) {
  const { open, onConfirm, onClose } = props;

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="sm">
      {open && <HighlightEdgeDialogContent onConfirm={onConfirm} onClose={onClose} />}
    </AppDialog>
  );
}
