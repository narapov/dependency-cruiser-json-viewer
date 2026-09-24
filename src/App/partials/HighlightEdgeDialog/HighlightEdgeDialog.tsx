import { useTranslation } from 'react-i18next';

import {
  buildCruiseTreeSnapshot,
  collectRelatedModuleSources,
  getCruiseModules,
  getDependencyKeysBetweenPaths,
  getEdgeHighlightColor,
} from '@/domain';
import { AppDialog, AppDialogContent, AppDialogTitle } from '@/Shared';

import { CruiseTreeProvider, useCruiseTreeRequired } from '../../contexts';
import { PathSearchBody } from '../PathSearchDialog';
import { useHighlightEdgeDialogState } from './hooks';
import { HighlightEdgeColorStep } from './partials';

interface HighlightEdgeDialogProps {
  open: boolean;
  userEdgeHighlights: ReadonlyMap<string, string>;
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
  userEdgeHighlights: ReadonlyMap<string, string>;
  onConfirm: (dependencyKeys: readonly string[], color: string | null) => void;
  onClose: () => void;
}

function HighlightEdgeDialogContent(props: HighlightEdgeDialogContentProps) {
  const { userEdgeHighlights, onConfirm, onClose } = props;

  const cruiseTree = useCruiseTreeRequired();
  const { t } = useTranslation();
  const { step, sourcePath, targetPath, selectSource, selectTarget } = useHighlightEdgeDialogState();

  const modules = getCruiseModules(cruiseTree);
  const targetSources = sourcePath != null ? collectRelatedModuleSources(sourcePath, modules, 'dependencies') : [];
  const targetCruiseTree = buildCruiseTreeSnapshot(getCruiseModules(cruiseTree, targetSources));

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
        {step === 'target' && (
          <CruiseTreeProvider value={targetCruiseTree}>
            <PathSearchBody onSelect={selectTarget} />
          </CruiseTreeProvider>
        )}
        {step === 'color' && (
          <HighlightEdgeColorStep currentHighlight={currentHighlight} onSelect={handleColorSelect} />
        )}
      </AppDialogContent>
    </>
  );
}

/** Multi-step dialog to pick source, target, and color for an edge highlight. */
export function HighlightEdgeDialog(props: HighlightEdgeDialogProps) {
  const { open, userEdgeHighlights, onConfirm, onClose } = props;

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="sm">
      {open && (
        <HighlightEdgeDialogContent userEdgeHighlights={userEdgeHighlights} onConfirm={onConfirm} onClose={onClose} />
      )}
    </AppDialog>
  );
}
