import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isSupportedLocale, type Locale } from "@/i18n/config";
import { createTranslator, type Dictionary, type Translator } from "@/i18n/translate";
import en from "@/i18n/locales/en.json";
import id from "@/i18n/locales/id.json";

const DICTIONARIES: Record<Locale, Dictionary> = { id, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Indonesian-first: the browser's Accept-Language is deliberately ignored, as in the app. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getTranslations(): Promise<Translator> {
  const locale = await getLocale();
  return createTranslator(getDictionary(locale), locale);
}
