import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { allExpanded, darkStyles, defaultStyles, JsonView } from 'react-json-view-lite';

import Button from '@mui/material/Button';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useResolvedColorMode } from '@/Shared';

import 'react-json-view-lite/dist/index.css';

type ExpandMode = 'initial' | 'all' | 'collapsed';

type ShouldExpandNode = (level: number, value: unknown, field?: string) => boolean;

const neverExpand: ShouldExpandNode = () => false;

interface JsonViewDialogProps {
  open: boolean;
  title: string;
  data: object | null;
  onClose: () => void;
  shouldExpandNode?: ShouldExpandNode;
  maxWidth?: DialogProps['maxWidth'];
  fullScreen?: boolean;
}

function resolveShouldExpandNode(expandMode: ExpandMode, initialShouldExpandNode: ShouldExpandNode): ShouldExpandNode {
  if (expandMode === 'all') {
    return allExpanded;
  }
  if (expandMode === 'collapsed') {
    return neverExpand;
  }
  return initialShouldExpandNode;
}

export function JsonViewDialog({
  open,
  title,
  data,
  onClose,
  shouldExpandNode = allExpanded,
  maxWidth = 'sm',
  fullScreen = false,
}: JsonViewDialogProps) {
  const { t } = useTranslation();
  const colorMode = useResolvedColorMode();
  const [expandMode, setExpandMode] = useState<ExpandMode>('initial');
  const [expandEpoch, setExpandEpoch] = useState(0);

  const remountWithMode = (mode: ExpandMode) => {
    setExpandMode(mode);
    setExpandEpoch(epoch => epoch + 1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen}
      sx={fullScreen ? undefined : { '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: 16 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {data != null && (
          <Typography component="div" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
            <JsonView
              key={expandEpoch}
              data={data}
              shouldExpandNode={resolveShouldExpandNode(expandMode, shouldExpandNode)}
              style={colorMode === 'dark' ? darkStyles : defaultStyles}
            />
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => remountWithMode('initial')}>{t('jsonView.initial')}</Button>
          <Button onClick={() => remountWithMode('all')}>{t('jsonView.expandAll')}</Button>
          <Button onClick={() => remountWithMode('collapsed')}>{t('jsonView.collapseAll')}</Button>
        </Stack>
        <Button onClick={onClose}>{t('actions.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
