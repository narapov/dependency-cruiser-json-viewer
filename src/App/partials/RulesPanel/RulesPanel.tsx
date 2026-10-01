import { useDeferredValue, useState } from 'react';

import Box from '@mui/material/Box';

import { getCruiseSources, groupRulesWithViolations } from '@/domain';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { matchesNameFilter } from './helpers/matchesNameFilter';
import { RulesList } from './partials/RulesList';
import { RulesNameFilter } from './partials/RulesNameFilter';

interface RulesPanelProps {
  onSelectViolationPaths: (paths: string[]) => void;
  onShowRuleViolations: (ruleName: string) => void;
}

export function RulesPanel(props: RulesPanelProps) {
  const { onSelectViolationPaths, onShowRuleViolations } = props;

  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const [nameFilter, setNameFilter] = useState('');
  const deferredNameFilter = useDeferredValue(nameFilter);
  const rules = groupRulesWithViolations(
    cruiseSnapshot.ruleSetUsed,
    cruiseSnapshot.violations,
    getCruiseSources(cruiseSnapshot),
  );
  const filteredRules = rules.filter(entry => matchesNameFilter(entry.name, deferredNameFilter));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <RulesNameFilter value={nameFilter} onChange={setNameFilter} />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <RulesList
          rules={rules}
          filteredRules={filteredRules}
          nameFilter={deferredNameFilter}
          onSelectViolationPaths={onSelectViolationPaths}
          onShowRuleViolations={onShowRuleViolations}
        />
      </Box>
    </Box>
  );
}
