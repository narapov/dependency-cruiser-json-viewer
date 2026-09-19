import type { IAnyRuleType } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { allExpanded } from 'react-json-view-lite';

import { JsonViewDialog } from '../JsonViewDialog';

interface RuleJsonDialogProps {
  open: boolean;
  ruleName: string;
  rule: IAnyRuleType | null;
  onClose: () => void;
}

export function RuleJsonDialog(props: RuleJsonDialogProps) {
  const { open, ruleName, rule, onClose } = props;

  const { t } = useTranslation();

  return (
    <JsonViewDialog
      open={open}
      title={t('rules.jsonTitle', { name: ruleName })}
      data={rule}
      onClose={onClose}
      shouldExpandNode={allExpanded}
    />
  );
}
