import { useTranslation } from 'react-i18next';

import { AppDialog, AppDialogTitle } from '@/Shared';

import { RuleViolationsPickerForm } from './partials/RuleViolationsPickerForm';
import type { RuleViolationsPickerOption } from './types';

export type { RuleViolationsPickerOption } from './types';

interface RuleViolationsPickerDialogProps {
  open: boolean;
  onClose: () => void;
  rules: readonly RuleViolationsPickerOption[];
  onConfirm: (ruleNames: string[]) => void;
}

export function RuleViolationsPickerDialog({ open, onClose, rules, onConfirm }: RuleViolationsPickerDialogProps) {
  const { t } = useTranslation();
  const formKey = rules.map(rule => rule.name).join('\0');

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="sm">
      <AppDialogTitle>{t('ruleViolationsPicker.title')}</AppDialogTitle>
      {open && <RuleViolationsPickerForm key={formKey} rules={rules} onClose={onClose} onConfirm={onConfirm} />}
    </AppDialog>
  );
}
