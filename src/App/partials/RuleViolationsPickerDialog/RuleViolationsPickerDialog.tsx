import { useTranslation } from 'react-i18next';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: 16 }}>{t('ruleViolationsPicker.title')}</DialogTitle>
      {open && <RuleViolationsPickerForm key={formKey} rules={rules} onClose={onClose} onConfirm={onConfirm} />}
    </Dialog>
  );
}
