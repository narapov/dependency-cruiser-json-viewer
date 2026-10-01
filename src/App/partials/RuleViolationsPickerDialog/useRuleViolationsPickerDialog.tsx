import { useState, type ReactNode } from 'react';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { RuleViolationsPickerDialog } from './RuleViolationsPickerDialog';

interface UseRuleViolationsPickerDialogOptions {
  onConfirm: (ruleNames: string[]) => void;
}

/**
 * Owns rule-violations picker open-state and returns the opener plus dialog node.
 * Rule options are derived from the workspace cruise snapshot.
 */
export function useRuleViolationsPickerDialog(config: UseRuleViolationsPickerDialogOptions): {
  openRuleViolationsPicker: () => void;
  ruleViolationsPickerDialog: ReactNode;
} {
  const { onConfirm } = config;

  const cruiseResult = useWorkspaceStore(state => state.cruiseResult);
  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const rules =
    cruiseResult == null
      ? []
      : cruiseSnapshot.rules
          .filter(entry => entry.violations.length > 0)
          .map(entry => ({
            name: entry.name,
            severity: entry.severity,
            violationCount: entry.violations.length,
          }));

  const [open, setOpen] = useState(false);

  const openRuleViolationsPicker = () => {
    setOpen(true);
  };

  const ruleViolationsPickerDialog = (
    <RuleViolationsPickerDialog open={open} rules={rules} onClose={() => setOpen(false)} onConfirm={onConfirm} />
  );

  return { openRuleViolationsPicker, ruleViolationsPickerDialog };
}
