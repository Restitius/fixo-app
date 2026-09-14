// i18next instance — statically imports every locale namespace since Metro
// bundles everything into one JS bundle anyway (no benefit to lazy-loading).
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from '../locales/en/auth.json'
import enProfile from '../locales/en/profile.json'
import enTabs from '../locales/en/tabs.json'
import enMisc from '../locales/en/misc.json'
import enBooking from '../locales/en/booking.json'
import enServices from '../locales/en/services.json'
import enNotifications from '../locales/en/notifications.json'
import swAuth from '../locales/sw/auth.json'
import swProfile from '../locales/sw/profile.json'
import swTabs from '../locales/sw/tabs.json'
import swMisc from '../locales/sw/misc.json'
import swBooking from '../locales/sw/booking.json'
import swServices from '../locales/sw/services.json'
import swNotifications from '../locales/sw/notifications.json'
import frAuth from '../locales/fr/auth.json'
import frProfile from '../locales/fr/profile.json'
import frTabs from '../locales/fr/tabs.json'
import frMisc from '../locales/fr/misc.json'
import frBooking from '../locales/fr/booking.json'
import frServices from '../locales/fr/services.json'
import frNotifications from '../locales/fr/notifications.json'
import arAuth from '../locales/ar/auth.json'
import arProfile from '../locales/ar/profile.json'
import arTabs from '../locales/ar/tabs.json'
import arMisc from '../locales/ar/misc.json'
import arBooking from '../locales/ar/booking.json'
import arServices from '../locales/ar/services.json'
import arNotifications from '../locales/ar/notifications.json'
import ptAuth from '../locales/pt/auth.json'
import ptProfile from '../locales/pt/profile.json'
import ptTabs from '../locales/pt/tabs.json'
import ptMisc from '../locales/pt/misc.json'
import ptBooking from '../locales/pt/booking.json'
import ptServices from '../locales/pt/services.json'
import ptNotifications from '../locales/pt/notifications.json'
import esAuth from '../locales/es/auth.json'
import esProfile from '../locales/es/profile.json'
import esTabs from '../locales/es/tabs.json'
import esMisc from '../locales/es/misc.json'
import esBooking from '../locales/es/booking.json'
import esServices from '../locales/es/services.json'
import esNotifications from '../locales/es/notifications.json'
import deAuth from '../locales/de/auth.json'
import deProfile from '../locales/de/profile.json'
import deTabs from '../locales/de/tabs.json'
import deMisc from '../locales/de/misc.json'
import deBooking from '../locales/de/booking.json'
import deServices from '../locales/de/services.json'
import deNotifications from '../locales/de/notifications.json'
import zhAuth from '../locales/zh/auth.json'
import zhProfile from '../locales/zh/profile.json'
import zhTabs from '../locales/zh/tabs.json'
import zhMisc from '../locales/zh/misc.json'
import zhBooking from '../locales/zh/booking.json'
import zhServices from '../locales/zh/services.json'
import zhNotifications from '../locales/zh/notifications.json'
import hiAuth from '../locales/hi/auth.json'
import hiProfile from '../locales/hi/profile.json'
import hiTabs from '../locales/hi/tabs.json'
import hiMisc from '../locales/hi/misc.json'
import hiBooking from '../locales/hi/booking.json'
import hiServices from '../locales/hi/services.json'
import hiNotifications from '../locales/hi/notifications.json'
import jaAuth from '../locales/ja/auth.json'
import jaProfile from '../locales/ja/profile.json'
import jaTabs from '../locales/ja/tabs.json'
import jaMisc from '../locales/ja/misc.json'
import jaBooking from '../locales/ja/booking.json'
import jaServices from '../locales/ja/services.json'
import jaNotifications from '../locales/ja/notifications.json'

export const SUPPORTED_LANGUAGES = ['en', 'sw', 'fr', 'ar', 'pt', 'es', 'de', 'zh', 'hi', 'ja'] as const
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]
export const RTL_LANGUAGES: readonly LanguageCode[] = ['ar']

const resources = {
  en: { auth: enAuth, profile: enProfile, tabs: enTabs, misc: enMisc, booking: enBooking, services: enServices, notifications: enNotifications },
  sw: { auth: swAuth, profile: swProfile, tabs: swTabs, misc: swMisc, booking: swBooking, services: swServices, notifications: swNotifications },
  fr: { auth: frAuth, profile: frProfile, tabs: frTabs, misc: frMisc, booking: frBooking, services: frServices, notifications: frNotifications },
  ar: { auth: arAuth, profile: arProfile, tabs: arTabs, misc: arMisc, booking: arBooking, services: arServices, notifications: arNotifications },
  pt: { auth: ptAuth, profile: ptProfile, tabs: ptTabs, misc: ptMisc, booking: ptBooking, services: ptServices, notifications: ptNotifications },
  es: { auth: esAuth, profile: esProfile, tabs: esTabs, misc: esMisc, booking: esBooking, services: esServices, notifications: esNotifications },
  de: { auth: deAuth, profile: deProfile, tabs: deTabs, misc: deMisc, booking: deBooking, services: deServices, notifications: deNotifications },
  zh: { auth: zhAuth, profile: zhProfile, tabs: zhTabs, misc: zhMisc, booking: zhBooking, services: zhServices, notifications: zhNotifications },
  hi: { auth: hiAuth, profile: hiProfile, tabs: hiTabs, misc: hiMisc, booking: hiBooking, services: hiServices, notifications: hiNotifications },
  ja: { auth: jaAuth, profile: jaProfile, tabs: jaTabs, misc: jaMisc, booking: jaBooking, services: jaServices, notifications: jaNotifications },
}

i18next.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['auth', 'profile', 'tabs', 'misc', 'booking', 'services', 'notifications'],
  defaultNS: 'auth',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18next
