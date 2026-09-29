import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { getCruiseSources, isPathInSources } from '@/domain';

import { useCruiseSnapshotRequired } from '../../contexts';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ApplicableRulesList } from './partials/ApplicableRulesList';
import { ApplicableRulesPanelHeader } from './partials/ApplicableRulesPanelHeader';

interface ApplicableRulesPanelProps {
  onClose: () => void;
  onShowInGraph: (path: string) => void;
  onSelectViolationPaths: (paths: string[]) => void;
}

export function ApplicableRulesPanel(props: ApplicableRulesPanelProps) {
  const { onClose, onShowInGraph, onSelectViolationPaths } = props;

  const { t } = useTranslation();
  const cruiseSnapshot = useCruiseSnapshotRequired();
  const path = useWorkspaceStore(state => {
    const sources = getCruiseSources(state.cruiseSnapshot);
    return state.applicableRulesPanelPath != null && isPathInSources(state.applicableRulesPanelPath, sources)
      ? state.applicableRulesPanelPath
      : null;
  });
  const rules = path != null ? (cruiseSnapshot.nodes.get(path)?.applicableRules ?? []) : [];

  if (path == null) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ApplicableRulesPanelHeader path={path} onClose={onClose} onShowInGraph={onShowInGraph} />
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 1, py: 1 }}>
        <Typography variant="subtitle1" sx={{ px: 1, pb: 0.5 }}>
          {t('applicableRulesPanel.title')}
        </Typography>
        <ApplicableRulesList rules={rules} onSelectViolationPaths={onSelectViolationPaths} />
      </Box>
    </Box>
  );
}
