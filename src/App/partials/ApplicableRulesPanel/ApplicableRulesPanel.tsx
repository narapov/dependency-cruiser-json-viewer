import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { getRulesApplicableToPath } from '@/domain';

import { ApplicableRulesList } from './partials/ApplicableRulesList';
import { ApplicableRulesPanelHeader } from './partials/ApplicableRulesPanelHeader';

interface ApplicableRulesPanelProps {
  path: string;
  modules: IModule[];
  ruleSetUsed: IFlattenedRuleSet | undefined;
  violations: readonly IViolation[] | undefined;
  onClose: () => void;
  onShowInGraph: (path: string) => void;
  onSelectViolationPaths: (paths: string[]) => void;
}

export function ApplicableRulesPanel({
  path,
  modules,
  ruleSetUsed,
  violations,
  onClose,
  onShowInGraph,
  onSelectViolationPaths,
}: ApplicableRulesPanelProps) {
  const { t } = useTranslation();
  const moduleSources = modules.map(module => module.source);
  const rules = getRulesApplicableToPath(path, ruleSetUsed, violations, moduleSources);

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
