import { useTranslation } from 'react-i18next';

import Typography from '@mui/material/Typography';

interface QuickPickEmptyMessageProps {
  isCommandMode: boolean;
  normalizedQuery: string;
}

export function QuickPickEmptyMessage(props: QuickPickEmptyMessageProps) {
  const { isCommandMode, normalizedQuery } = props;

  const { t } = useTranslation();

  let message = t('quickPick.startTyping');
  if (isCommandMode) {
    message = normalizedQuery.trim() ? t('quickPick.noMatchingCommands') : t('quickPick.typeToFilterCommands');
  } else if (normalizedQuery.trim()) {
    message = t('quickPick.noMatchingFiles');
  }

  return (
    <Typography sx={{ px: 1.5, py: 2, color: 'text.secondary', fontSize: 13, textAlign: 'center' }}>
      {message}
    </Typography>
  );
}
