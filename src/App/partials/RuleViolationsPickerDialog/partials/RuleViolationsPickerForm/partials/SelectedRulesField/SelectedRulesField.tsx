import { useController, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RuleSeverityChip, RuleViolationsCountChip } from '@/Shared';

import type { RuleViolationsPickerOption } from '../../../../types';
import type { RuleViolationsPickerFormValues } from '../../types';

interface SelectedRulesFieldProps {
  rules: readonly RuleViolationsPickerOption[];
}

export function SelectedRulesField(props: SelectedRulesFieldProps) {
  const { rules } = props;

  const { t } = useTranslation();
  const { control } = useFormContext<RuleViolationsPickerFormValues>();
  const { field } = useController({ name: 'selectedRules', control });
  const selectedRules = field.value;

  const allSelected = selectedRules.length === rules.length;
  const noneSelected = selectedRules.length === 0;

  const toggleRule = (name: string) => {
    field.onChange(
      selectedRules.includes(name) ? selectedRules.filter(selected => selected !== name) : [...selectedRules, name],
    );
  };

  const handleSelectAll = () => {
    field.onChange(rules.map(rule => rule.name));
  };

  const handleDeselectAll = () => {
    field.onChange([]);
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button type="button" size="small" onClick={handleSelectAll} disabled={allSelected}>
          {t('ruleViolationsPicker.selectAll')}
        </Button>
        <Button type="button" size="small" onClick={handleDeselectAll} disabled={noneSelected}>
          {t('ruleViolationsPicker.deselectAll')}
        </Button>
      </Stack>
      <List dense disablePadding role="listbox" aria-label={t('ruleViolationsPicker.ruleOptions')}>
        {rules.map(rule => {
          const checked = selectedRules.includes(rule.name);
          return (
            <ListItem key={rule.name} disablePadding>
              <ListItemButton
                role="option"
                aria-selected={checked}
                onClick={() => toggleRule(rule.name)}
                dense
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: 12,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {rule.name}
                      </Typography>
                      <RuleSeverityChip severity={rule.severity} />
                      <RuleViolationsCountChip count={rule.violationCount} />
                    </Stack>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );
}
