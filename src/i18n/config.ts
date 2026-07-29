/**
 * Mirrors Laku-Marketplace/i18n/index.ts: Indonesian-first with an explicit
 * English opt-in, and no browser-locale detection.
 */
export const SUPPORTED_LOCALES = ["id", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";

/** Preference cookie so the server renders the chosen language without a flash. */
export const LOCALE_COOKIE = "laku_lang";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Language names stay in their own language, exactly as the app shows them. */
export const LANGUAGE_LABELS: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

export function isSupportedLocale(value?: string | null): value is Locale {
  return SUPPORTED_LOCALES.includes((value ?? "") as Locale);
}

/** Intl tag used for currency, dates, and number formatting. */
export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "id-ID";
}
