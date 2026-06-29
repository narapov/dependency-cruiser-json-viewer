export const THEME_OPTIONS = [
  { value: 'light', labelKey: 'theme.light' },
  { value: 'dark', labelKey: 'theme.dark' },
  { value: 'system', labelKey: 'theme.system' },
] as const;

export type ThemeOptionValue = (typeof THEME_OPTIONS)[number]['value'];
