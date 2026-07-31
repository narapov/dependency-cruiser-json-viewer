import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { beforeEach, expect } from 'vitest';

import * as matchers from '@testing-library/jest-dom/matchers';

import { SUPPORTED_LANGUAGES } from './i18n/languageOptions';
import de from './i18n/locales/de.json';
import en from './i18n/locales/en.json';
import es from './i18n/locales/es.json';
import fr from './i18n/locales/fr.json';
import ru from './i18n/locales/ru.json';

// extends Vitest's expect method with methods from react-testing-library
// https://markus.oberlehner.net/blog/using-testing-library-jest-dom-with-vitest
expect.extend(matchers);

await i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    ru: { translation: ru },
    es: { translation: es },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false,
  },
});

beforeEach(async () => {
  await i18n.changeLanguage('en');
});
