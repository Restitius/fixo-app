// Language selection — device detection, persistence, and RTL switching.
// A manual in-app choice (persisted under EXPLICIT_KEY) always wins over the
// account's preferred_language, which itself only applies once, on adoption.
import AsyncStorage from '@react-native-async-storage/async-storage'
import { I18nManager, Platform } from 'react-native'
import { reloadAppAsync } from 'expo'
import * as Localization from 'expo-localization'
import i18n, { SUPPORTED_LANGUAGES, RTL_LANGUAGES, type LanguageCode } from './i18n'

export type { LanguageCode }

const EXPLICIT_KEY = 'fixo_language_explicit'

// Shown in the language picker in each language's own script — a language's
// name is conventionally never translated into the currently-active locale.
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  sw: 'Kiswahili',
  fr: 'Français',
  ar: 'العربية',
  pt: 'Português',
  es: 'Español',
  de: 'Deutsch',
  zh: '中文',
  hi: 'हिन्दी',
  ja: '日本語',
}

function isSupported(code: string | null | undefined): code is LanguageCode {
  return !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
}

export function isRtl(code: LanguageCode): boolean {
  return RTL_LANGUAGES.includes(code)
}

function detectDeviceLanguage(): LanguageCode {
  const tag = Localization.getLocales()[0]?.languageCode
  return isSupported(tag) ? tag : 'en'
}

// Resolution order: explicit local override -> device locale -> 'en'.
// The account's preferred_language is adopted separately once auth loads
// (see adoptAccountLanguage), since it isn't known until after this runs.
export async function resolveInitialLanguage(): Promise<LanguageCode> {
  try {
    const explicit = await AsyncStorage.getItem(EXPLICIT_KEY)
    if (isSupported(explicit)) return explicit
  } catch {
    // fall through to device detection
  }
  return detectDeviceLanguage()
}

export async function adoptAccountLanguage(code: string | null | undefined): Promise<void> {
  try {
    const explicit = await AsyncStorage.getItem(EXPLICIT_KEY)
    if (explicit) return // a manual in-app choice always wins
  } catch {
    // if we can't read the override, still avoid clobbering a likely one
    return
  }
  if (isSupported(code) && code !== i18n.language) {
    await i18n.changeLanguage(code)
  }
}

// Interactive switch from the language picker. On native, React Native only
// applies a forceRTL flip on the NEXT app launch, so switching to/from Arabic
// triggers a reload — the caller should show a brief "restarting" message
// beforehand and skip any post-switch navigation, since the reload wipes the
// in-memory nav stack anyway. Returns true when a reload was triggered. On
// web there's no such limitation — `document.dir` applies immediately, no
// reload, so this always returns false there.
export async function setLanguage(code: LanguageCode, opts: { persistExplicit?: boolean } = {}): Promise<boolean> {
  await i18n.changeLanguage(code)
  if (opts.persistExplicit) {
    try {
      await AsyncStorage.setItem(EXPLICIT_KEY, code)
    } catch {
      // non-fatal — the choice just won't survive a restart
    }
  }

  const wantsRtl = isRtl(code)

  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = wantsRtl ? 'rtl' : 'ltr'
    }
    return false
  }

  // Boolean(...) guards react-native-web's I18nManager shim (isRTL can come
  // back non-boolean there) — belt-and-suspenders now that web returns above,
  // but keeps this correct if some native runtime ever reports it oddly too.
  if (Boolean(I18nManager.isRTL) !== wantsRtl) {
    I18nManager.allowRTL(wantsRtl)
    I18nManager.forceRTL(wantsRtl)
    try {
      await reloadAppAsync('Applying language change')
      return true
    } catch {
      // reload not available in this runtime (e.g. some dev-client configs)
      // — RTL layout fully applies on the next manual app restart instead.
    }
  }
  return false
}
