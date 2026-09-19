import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { AppDialogActions, AppDialogContent } from '@/Shared';

import type { RuleViolationsPickerOption } from '../../types';
import { ruleViolationsPickerSchema } from './constants';
import { SelectedRulesField } from './partials/SelectedRulesField';
import type { RuleViolationsPickerFormValues } from './types';

interface RuleViolationsPickerFormProps {
  rules: readonly RuleViolationsPickerOption[];
  onClose: () => void;
  onConfirm: (ruleNames: string[]) => void;
}

export function RuleViolationsPickerForm({ rules, onClose, onConfirm }: RuleViolationsPickerFormProps) {
  const { t } = useTranslation();
  const form = useForm<RuleViolationsPickerFormValues>({
    resolver: zodResolver(ruleViolationsPickerSchema),
    defaultValues: { selectedRules: rules.map(rule => rule.name) },
    mode: 'onChange',
  });

  const onValid = (values: RuleViolationsPickerFormValues) => {
    onConfirm(values.selectedRules);
    onClose();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onValid)}>
        <AppDialogContent>
          {rules.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('ruleViolationsPicker.empty')}
            </Typography>
          ) : (
            <SelectedRulesField rules={rules} />
          )}
        </AppDialogContent>
        <AppDialogActions>
          <Button type="button" onClick={onClose}>
            {t('ruleViolationsPicker.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={!form.formState.isValid}>
            {t('ruleViolationsPicker.confirm')}
          </Button>
        </AppDialogActions>
      </form>
    </FormProvider>
  );
}
