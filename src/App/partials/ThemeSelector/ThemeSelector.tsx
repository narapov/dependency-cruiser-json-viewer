import { useTranslation } from 'react-i18next';

import Brightness4Outlined from '@mui/icons-material/Brightness4Outlined';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

import { THEME_OPTIONS } from './themeOptions';

const THEME_ICONS = {
  light: LightModeOutlined,
  dark: DarkModeOutlined,
  system: Brightness4Outlined,
} as const;

export function ThemeSelector() {
  const { mode, setMode } = useColorScheme();
  const { t } = useTranslation();

  if (!mode) {
    return null;
  }

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={mode}
      onChange={(_, value: typeof mode | null) => {
        if (value != null) {
          setMode(value);
        }
      }}
      aria-label={t('theme.label')}
      sx={{
        '& .MuiToggleButton-root': {
          color: 'rgba(255, 255, 255, 0.75)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          px: 0.75,
          py: 0.5,
          '&.Mui-selected': {
            color: '#fff',
            bgcolor: 'rgba(255, 255, 255, 0.12)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.18)',
            },
          },
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      }}
    >
      {THEME_OPTIONS.map(({ value, labelKey }) => {
        const label = t(labelKey);
        const Icon = THEME_ICONS[value];
        return (
          <Tooltip key={value} title={label}>
            <span>
              <ToggleButton value={value} aria-label={label}>
                <Icon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </span>
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
}
