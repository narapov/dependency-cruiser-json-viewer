import { useTranslation } from 'react-i18next';

import ClearOutlined from '@mui/icons-material/ClearOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
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
          input: {
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label={t('actions.clear')} onClick={() => onChange('')} edge="end">
                  <ClearOutlined fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
          htmlInput: {
            'aria-label': t('rules.filterPlaceholder'),
          },
        }}
      />
    </Box>
  );
}
