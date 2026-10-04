import { useRef, type RefObject } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AppDialog, AppDialogActions, AppDialogContent, AppDialogTitle } from '@/Shared';

interface FolderLevelDialogProps {
  open: boolean;
  paths: readonly string[];
  onClose: () => void;
  onConfirm: (level: number) => void;
}

const folderLevelSchema = z.object({
  level: z.number().int().min(1),
});

type FolderLevelFormValues = z.infer<typeof folderLevelSchema>;

interface FolderLevelFormProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onConfirm: (level: number) => void;
}

function FolderLevelForm(props: FolderLevelFormProps) {
  const { inputRef, onClose, onConfirm } = props;

  const { t } = useTranslation();
  const form = useForm<FolderLevelFormValues>({
    resolver: zodResolver(folderLevelSchema),
    defaultValues: { level: 1 },
    mode: 'onChange',
  });
  const { field, fieldState } = useController({ name: 'level', control: form.control });
  const { isValid } = form.formState;

  const onValid = (values: FolderLevelFormValues) => {
    onConfirm(values.level);
    onClose();
  };

  return (
    <Box component="form" onSubmit={form.handleSubmit(onValid)} sx={{ display: 'contents' }}>
      <AppDialogContent>
        <TextField
          name={field.name}
          inputRef={inputRef}
          value={Number.isNaN(field.value) ? '' : field.value}
          onBlur={field.onBlur}
          onChange={event => {
            const next = event.target.value;
            field.onChange(next === '' ? Number.NaN : Number(next));
          }}
          fullWidth
          type="number"
          label={t('folderLevel.level')}
          error={!!fieldState.error}
          slotProps={{
            htmlInput: { min: 1, step: 1 },
          }}
        />
      </AppDialogContent>
      <AppDialogActions>
        <Button type="button" onClick={onClose}>
          {t('actions.close')}
        </Button>
        <Button type="submit" variant="contained" disabled={!isValid}>
          {t('folderLevel.confirm')}
        </Button>
      </AppDialogActions>
    </Box>
  );
}

export function FolderLevelDialog(props: FolderLevelDialogProps) {
  const { open, paths, onClose, onConfirm } = props;

  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pathsLabel = paths.join(', ');

  const focusInput = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="xs" slotProps={{ transition: { onEntered: focusInput } }}>
      <AppDialogTitle>{t('folderLevel.title')}</AppDialogTitle>
      {paths.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 0.5 }} noWrap title={pathsLabel}>
          {pathsLabel}
        </Typography>
      )}
      {open && <FolderLevelForm inputRef={inputRef} onClose={onClose} onConfirm={onConfirm} />}
    </AppDialog>
  );
}
