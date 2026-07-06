import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';

interface GraphLayoutToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function GraphLayoutToggle({ checked, onChange }: GraphLayoutToggleProps) {
  const { t } = useTranslation();
  const label = t('graph.autoLayoutOnly');
  const hint = t('graph.autoLayoutOnlyHint');

  return (
    <Box
      sx={{
        p: '4px 10px',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        fontSize: 12,
      }}
    >
      <Tooltip title={hint}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={checked}
              onChange={(_, value) => onChange(value)}
              slotProps={{ input: { 'aria-label': label } }}
            />
          }
          label={label}
          sx={{
            m: 0,
            gap: 0.5,
            '& .MuiFormControlLabel-label': {
              fontSize: 12,
            },
          }}
        />
      </Tooltip>
    </Box>
  );
}
