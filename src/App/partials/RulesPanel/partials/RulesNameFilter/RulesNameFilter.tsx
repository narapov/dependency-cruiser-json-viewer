import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

interface RulesNameFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function RulesNameFilter({ value, onChange }: RulesNameFilterProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ flexShrink: 0, px: 1, pt: 1, pb: 0.5 }}>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={t('rules.filterPlaceholder')}
        slotProps={{
          htmlInput: {
            'aria-label': t('rules.filterPlaceholder'),
          },
        }}
      />
    </Box>
  );
}
