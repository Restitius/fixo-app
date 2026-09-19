// Language selection for web — client-driven, mirroring mobile's lib/language.ts.
import { SUPPORTED_LANGUAGES, RTL_LANGUAGES, type LanguageCode } from "./i18n";

export type { LanguageCode };

// Shown in the language picker in each language's own script — a language's
// name is conventionally never translated into the currently-active locale.
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  sw: "Kiswahili",
  fr: "Français",
  ar: "العربية",
  pt: "Português",
  es: "Español",
  de: "Deutsch",
  zh: "中文",
  hi: "हिन्दी",
  ja: "日本語",
};

const STORAGE_KEY = "fixo_lang";
const EXPLICIT_KEY = "fixo_lang_explicit";

export function isSupported(code: string | null | undefined): code is LanguageCode {
  return !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

export function isRtl(code: string): boolean {
  return (RTL_LANGUAGES as readonly string[]).includes(code);
}

// Resolution order: explicit local choice -> 'en'. English is the hard
// default for anyone who hasn't made a choice — deliberately NOT auto-detected
// from the browser's Accept-Language, so a fresh visit always reads in
// English rather than guessing (often wrongly) from browser settings. The
// account's preferred_language is adopted separately once auth loads (see
// adoptAccountLanguage), since it isn't known this early, and itself defaults
// to 'en' server-side unless the user explicitly changed it.
export function resolveInitialLanguage(): LanguageCode {
  try {
    const explicit = localStorage.getItem(EXPLICIT_KEY);
    if (isSupported(explicit)) return explicit;
  } catch {
    // ignore — falls through to the English default
  }
  return "en";
}

export function adoptAccountLanguage(
  i18n: { language: string; changeLanguage: (l: string) => unknown },
  code: string | null | undefined,
): void {
  try {
    if (localStorage.getItem(EXPLICIT_KEY)) return; // a manual in-app choice always wins
  } catch {
    return;
  }
  if (isSupported(code) && code !== i18n.language) {
    void i18n.changeLanguage(code);
  }
}

export function setLanguage(
  i18n: { changeLanguage: (l: string) => Promise<unknown> },
  code: LanguageCode,
): Promise<unknown> {
  try {
    localStorage.setItem(EXPLICIT_KEY, code);
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // non-fatal — the choice just won't survive a reload
  }
  return i18n.changeLanguage(code);
}
