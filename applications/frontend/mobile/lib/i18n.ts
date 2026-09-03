// i18next instance — statically imports every locale namespace since Metro
// bundles everything into one JS bundle anyway (no benefit to lazy-loading).
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from '../locales/en/auth.json'
import enProfile from '../locales/en/profile.json'
import swAuth from '../locales/sw/auth.json'
import swProfile from '../locales/sw/profile.json'
import frAuth from '../locales/fr/auth.json'
import frProfile from '../locales/fr/profile.json'
import arAuth from '../locales/ar/auth.json'
import arProfile from '../locales/ar/profile.json'
import ptAuth from '../locales/pt/auth.json'
import ptProfile from '../locales/pt/profile.json'
import esAuth from '../locales/es/auth.json'
import esProfile from '../locales/es/profile.json'
import deAuth from '../locales/de/auth.json'
import deProfile from '../locales/de/profile.json'
import zhAuth from '../locales/zh/auth.json'
import zhProfile from '../locales/zh/profile.json'
import hiAuth from '../locales/hi/auth.json'
import hiProfile from '../locales/hi/profile.json'
import jaAuth from '../locales/ja/auth.json'
import jaProfile from '../locales/ja/profile.json'

export const SUPPORTED_LANGUAGES = ['en', 'sw', 'fr', 'ar', 'pt', 'es', 'de', 'zh', 'hi', 'ja'] as const
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]
export const RTL_LANGUAGES: readonly LanguageCode[] = ['ar']

const resources = {
  en: { auth: enAuth, profile: enProfile },
  sw: { auth: swAuth, profile: swProfile },
  fr: { auth: frAuth, profile: frProfile },
  ar: { auth: arAuth, profile: arProfile },
  pt: { auth: ptAuth, profile: ptProfile },
  es: { auth: esAuth, profile: esProfile },
  de: { auth: deAuth, profile: deProfile },
  zh: { auth: zhAuth, profile: zhProfile },
  hi: { auth: hiAuth, profile: hiProfile },
  ja: { auth: jaAuth, profile: jaProfile },
}

i18next.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['auth', 'profile'],
  defaultNS: 'auth',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18next
