import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AppDialog, AppDialogActions, AppDialogContent, AppDialogTitle } from '@/Shared';

import { GLOB_PATTERNS_DOCS_URL, IGNORE_PATTERN_EXAMPLES, IGNORE_PATTERN_PLACEHOLDER } from './ignorePatternsOptions';

interface IgnorePatternsDialogProps {
  open: boolean;
  patterns: string[];
  onClose: () => void;
  onSave: (patterns: string[]) => void;
}

function patternsToText(patterns: string[]): string {
  return patterns.join('\n');
}

function textToPatterns(text: string): string[] {
  return [
    ...new Set(
      text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0),
    ),
  ];
}

interface IgnorePatternsFormProps {
  patterns: string[];
  onClose: () => void;
  onSave: (patterns: string[]) => void;
}

function IgnorePatternsForm({ patterns, onClose, onSave }: IgnorePatternsFormProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => patternsToText(patterns));

  const handleSave = () => {
    onSave(textToPatterns(draft));
    onClose();
  };

  const handleAddExample = (example: string) => {
    setDraft(current => (current.trim().length === 0 ? example : `${current.trimEnd()}\n${example}`));
  };

  return (
    <>
      <AppDialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('ignorePatterns.description')}
        </Typography>
        <Link
          href={GLOB_PATTERNS_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          sx={{ display: 'inline-block', mb: 2 }}
        >
          {t('ignorePatterns.docsLink')}
        </Link>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={6}
          maxRows={14}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder={IGNORE_PATTERN_PLACEHOLDER}
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', fontSize: 13 },
            },
          }}
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {t('ignorePatterns.examples')}
          </Typography>
          <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap' }}>
            {IGNORE_PATTERN_EXAMPLES.map(example => (
              <Chip
                key={example}
                label={example}
                size="small"
                variant="outlined"
                clickable
                onClick={() => handleAddExample(example)}
                sx={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            ))}
          </Stack>
        </Box>
      </AppDialogContent>
      <AppDialogActions>
        <Button onClick={onClose}>{t('ignorePatterns.cancel')}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t('ignorePatterns.save')}
        </Button>
      </AppDialogActions>
    </>
  );
}

export function IgnorePatternsDialog({ open, patterns, onClose, onSave }: IgnorePatternsDialogProps) {
  const { t } = useTranslation();

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="sm">
      <AppDialogTitle>{t('ignorePatterns.setIgnorePatterns')}</AppDialogTitle>
      {open && (
        <IgnorePatternsForm key={patternsToText(patterns)} patterns={patterns} onClose={onClose} onSave={onSave} />
      )}
    </AppDialog>
  );
}
