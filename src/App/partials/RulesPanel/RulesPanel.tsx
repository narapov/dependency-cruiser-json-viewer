import type { IFlattenedRuleSet, IViolation } from 'dependency-cruiser';
import { useDeferredValue, useState } from 'react';

import Box from '@mui/material/Box';

import { groupRulesWithViolations } from '@/domain';

import { matchesNameFilter } from './helpers/matchesNameFilter';
import { RulesList } from './partials/RulesList';
import { RulesNameFilter } from './partials/RulesNameFilter';

interface RulesPanelProps {
  ruleSetUsed: IFlattenedRuleSet | undefined;
  violations: readonly IViolation[] | undefined;
  sources: readonly string[];
  onSelectViolationPaths: (paths: string[]) => void;
}

export function RulesPanel({ ruleSetUsed, violations, sources, onSelectViolationPaths }: RulesPanelProps) {
  const [nameFilter, setNameFilter] = useState('');
  const deferredNameFilter = useDeferredValue(nameFilter);
  const rules = groupRulesWithViolations(ruleSetUsed, violations, sources);
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
        />
      </Box>
    </Box>
  );
}
