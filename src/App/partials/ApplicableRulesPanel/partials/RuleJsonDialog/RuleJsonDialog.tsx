import type { IAnyRuleType } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

interface RuleJsonDialogProps {
  open: boolean;
  ruleName: string;
  rule: IAnyRuleType | null;
  onClose: () => void;
}

export function RuleJsonDialog({ open, ruleName, rule, onClose }: RuleJsonDialogProps) {
  const { t } = useTranslation();
  const json = rule == null ? '' : JSON.stringify(rule, null, 2);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: 16 }}>{t('rules.jsonTitle', { name: ruleName })}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <pre
          style={{
            margin: 0,
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {json}
        </pre>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('actions.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
