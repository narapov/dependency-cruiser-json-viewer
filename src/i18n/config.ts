import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type LanguageOptionValue } from './languageOptions';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';

function getStoredLanguage(): LanguageOptionValue {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored != null && SUPPORTED_LANGUAGES.includes(stored as LanguageOptionValue)) {
    return stored as LanguageOptionValue;
  }
  return 'en';
}

function syncDocumentLanguage(language: string) {
  document.documentElement.lang = language;
}

const initialLanguage = getStoredLanguage();
syncDocumentLanguage(initialLanguage);

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    ru: { translation: ru },
    es: { translation: es },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', language => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  syncDocumentLanguage(language);
});

export default i18n;
