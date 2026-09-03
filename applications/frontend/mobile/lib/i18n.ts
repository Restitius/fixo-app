// i18next instance — statically imports every locale namespace since Metro
// bundles everything into one JS bundle anyway (no benefit to lazy-loading).
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from '../locales/en/auth.json'
import enProfile from '../locales/en/profile.json'
import enTabs from '../locales/en/tabs.json'
import swAuth from '../locales/sw/auth.json'
import swProfile from '../locales/sw/profile.json'
import swTabs from '../locales/sw/tabs.json'
import frAuth from '../locales/fr/auth.json'
import frProfile from '../locales/fr/profile.json'
import frTabs from '../locales/fr/tabs.json'
import arAuth from '../locales/ar/auth.json'
import arProfile from '../locales/ar/profile.json'
import arTabs from '../locales/ar/tabs.json'
import ptAuth from '../locales/pt/auth.json'
import ptProfile from '../locales/pt/profile.json'
import ptTabs from '../locales/pt/tabs.json'
import esAuth from '../locales/es/auth.json'
import esProfile from '../locales/es/profile.json'
import esTabs from '../locales/es/tabs.json'
import deAuth from '../locales/de/auth.json'
import deProfile from '../locales/de/profile.json'
import deTabs from '../locales/de/tabs.json'
import zhAuth from '../locales/zh/auth.json'
import zhProfile from '../locales/zh/profile.json'
import zhTabs from '../locales/zh/tabs.json'
import hiAuth from '../locales/hi/auth.json'
import hiProfile from '../locales/hi/profile.json'
import hiTabs from '../locales/hi/tabs.json'
import jaAuth from '../locales/ja/auth.json'
import jaProfile from '../locales/ja/profile.json'
import jaTabs from '../locales/ja/tabs.json'

export const SUPPORTED_LANGUAGES = ['en', 'sw', 'fr', 'ar', 'pt', 'es', 'de', 'zh', 'hi', 'ja'] as const
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]
export const RTL_LANGUAGES: readonly LanguageCode[] = ['ar']

const resources = {
  en: { auth: enAuth, profile: enProfile, tabs: enTabs },
  sw: { auth: swAuth, profile: swProfile, tabs: swTabs },
  fr: { auth: frAuth, profile: frProfile, tabs: frTabs },
  ar: { auth: arAuth, profile: arProfile, tabs: arTabs },
  pt: { auth: ptAuth, profile: ptProfile, tabs: ptTabs },
  es: { auth: esAuth, profile: esProfile, tabs: esTabs },
  de: { auth: deAuth, profile: deProfile, tabs: deTabs },
  zh: { auth: zhAuth, profile: zhProfile, tabs: zhTabs },
  hi: { auth: hiAuth, profile: hiProfile, tabs: hiTabs },
  ja: { auth: jaAuth, profile: jaProfile, tabs: jaTabs },
}

i18next.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['auth', 'profile', 'tabs'],
  defaultNS: 'auth',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18next
