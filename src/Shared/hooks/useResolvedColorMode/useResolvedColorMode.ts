import { useColorScheme } from '@mui/material/styles';

/** Resolves MUI color scheme mode to concrete light or dark (handles `system`). */
export function useResolvedColorMode(): 'light' | 'dark' {
  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === 'system' ? systemMode : mode;
  return resolvedMode ?? 'light';
}
