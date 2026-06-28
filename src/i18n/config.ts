import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import ru from './locales/ru.json'
import { LANGUAGE_STORAGE_KEY, type LanguageOptionValue } from './languageOptions'

function getStoredLanguage(): LanguageOptionValue {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'en' || stored === 'fr' || stored === 'de' || stored === 'ru') {
    return stored
  }
  return 'en'
}

function syncDocumentLanguage(language: string) {
  document.documentElement.lang = language
}

const initialLanguage = getStoredLanguage()
syncDocumentLanguage(initialLanguage)

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    ru: { translation: ru },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr', 'de', 'ru'],
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  syncDocumentLanguage(language)
})

export default i18n
