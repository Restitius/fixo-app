// i18next instance — Vite code-splits each locale JSON via import.meta.glob,
// loaded on demand per language/namespace. This is a client-driven singleton
// (mirrors mobile's lib/i18n.ts): this app's SSR only renders a static shell
// and every route resolves its own data client-side after mount, so there's
// no per-request server state to thread an i18n instance through.
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

export const SUPPORTED_LANGUAGES = ['en', 'sw', 'fr', 'ar', 'pt', 'es', 'de', 'zh', 'hi', 'ja'] as const
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]
export const RTL_LANGUAGES: readonly LanguageCode[] = ['ar']
export const NAMESPACES = ['auth', 'profile', 'home'] as const

const localeModules = import.meta.glob<{ default: Record<string, unknown> }>('../locales/*/*.json')

i18next
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      const loader = localeModules[`../locales/${language}/${namespace}.json`]
      return loader ? loader().then((mod) => mod.default) : Promise.resolve({})
    }),
  )
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: NAMESPACES,
    defaultNS: 'auth',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

export default i18next
