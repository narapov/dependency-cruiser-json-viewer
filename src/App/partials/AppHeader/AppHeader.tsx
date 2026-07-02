import { useTranslation } from 'react-i18next';

import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TerminalOutlined from '@mui/icons-material/TerminalOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { formatShortcut } from '@/Shared';

import { LanguageSelector } from '../LanguageSelector';
import { ThemeSelector } from '../ThemeSelector';

const headerSecondaryTextSx = {
  marginLeft: 1.5,
  fontWeight: 400,
  color: 'rgba(255, 255, 255, 0.65)',
} as const;

const headerIconButtonSx = {
  color: 'rgba(255, 255, 255, 0.75)',
  p: 0.5,
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.08)',
  },
} as const;

interface AppHeaderProps {
  filteredModulesCount?: number;
  totalModulesCount?: number;
  hasIgnoredModules?: boolean;
  onOpenFileSearch: () => void;
  onOpenCommandPalette: () => void;
  onOpenIgnorePatterns: () => void;
}

export function AppHeader({
  filteredModulesCount,
  totalModulesCount,
  hasIgnoredModules = false,
  onOpenFileSearch,
  onOpenCommandPalette,
  onOpenIgnorePatterns,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const searchFilesLabel = t('app.searchFiles', { shortcut: formatShortcut('P') });
  const commandPaletteLabel = t('app.commandPalette');
  const ignorePatternsLabel = t('ignorePatterns.setIgnorePatterns');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Stack direction="row" spacing={0} sx={{ alignItems: 'center' }}>
        <Typography variant="subtitle1" component="h1" sx={{ margin: 0, color: 'common.white', fontWeight: 600 }}>
          {t('app.title')}
        </Typography>
        {filteredModulesCount != null && totalModulesCount != null && (
          <Typography component="span" variant="body2" sx={headerSecondaryTextSx}>
            {t('app.modulesCountFiltered', {
              filtered: filteredModulesCount,
              total: totalModulesCount,
            })}
          </Typography>
        )}
        <Tooltip title={ignorePatternsLabel}>
          <IconButton
            size="small"
            onClick={onOpenIgnorePatterns}
            aria-label={ignorePatternsLabel}
            sx={{
              ...headerIconButtonSx,
              ml: 0.25,
              color: hasIgnoredModules ? 'warning.light' : headerIconButtonSx.color,
              '&:hover': hasIgnoredModules ? { bgcolor: 'rgba(255, 183, 77, 0.16)' } : headerIconButtonSx['&:hover'],
            }}
          >
            <FilterAltOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Tooltip title={searchFilesLabel}>
          <IconButton size="small" aria-label={searchFilesLabel} onClick={onOpenFileSearch} sx={headerIconButtonSx}>
            <SearchOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={commandPaletteLabel}>
          <IconButton
            size="small"
            aria-label={commandPaletteLabel}
            onClick={onOpenCommandPalette}
            sx={headerIconButtonSx}
          >
            <TerminalOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <LanguageSelector />
        <ThemeSelector />
      </Stack>
    </Box>
  );
}
