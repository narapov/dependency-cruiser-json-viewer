import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Typography from '@mui/material/Typography';

interface QuickPickEmptyMessageProps {
  isCommandMode: boolean;
  normalizedDeferredQuery: string;
}

export function QuickPickEmptyMessage({ isCommandMode, normalizedDeferredQuery }: QuickPickEmptyMessageProps) {
  const { t } = useTranslation();

  const message = useMemo(() => {
    if (isCommandMode) {
      if (normalizedDeferredQuery.trim()) {
        return t('quickPick.noMatchingCommands');
      }
      return t('quickPick.typeToFilterCommands');
    }

    if (normalizedDeferredQuery.trim()) {
      return t('quickPick.noMatchingFiles');
    }

    return t('quickPick.startTyping');
  }, [isCommandMode, normalizedDeferredQuery, t]);

  return (
    <Typography sx={{ px: 1.5, py: 2, color: 'text.secondary', fontSize: 13, textAlign: 'center' }}>
      {message}
    </Typography>
  );
}
