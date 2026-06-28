export const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'language.en' },
  { value: 'fr', labelKey: 'language.fr' },
  { value: 'de', labelKey: 'language.de' },
  { value: 'ru', labelKey: 'language.ru' },
] as const

export type LanguageOptionValue = (typeof LANGUAGE_OPTIONS)[number]['value']

export const LANGUAGE_STORAGE_KEY = 'language'
