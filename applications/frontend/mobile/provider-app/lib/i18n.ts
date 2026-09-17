// i18next instance. English-only for now — user-app's 10-language locale
// set exists because those translations were reviewed for that app; rather
// than duplicate machine-shaped text across 9 more languages for a brand
// new app with no translation review yet, this starts English-only with
// the same namespace structure so real translations can be added exactly
// the way user-app's were, without a later refactor.
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from '../locales/en/auth.json'
import enTabs from '../locales/en/tabs.json'

export const SUPPORTED_LANGUAGES = ['en'] as const
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]

const resources = {
  en: { auth: enAuth, tabs: enTabs },
}

i18next.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['auth', 'tabs'],
  defaultNS: 'auth',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18next
