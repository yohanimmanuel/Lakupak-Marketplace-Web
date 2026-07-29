"use client";

import { createContext, useContext, useMemo } from "react";

import type { Locale } from "@/i18n/config";
import { createTranslator, type Dictionary, type Translator } from "@/i18n/translate";

const I18nContext = createContext<{ dictionary: Dictionary; locale: Locale } | null>(null);

/**
 * The dictionary is resolved once on the server and handed to the tree, so
 * client components translate without a second fetch or a hydration flash.
 */
export function I18nProvider({
  dictionary,
  locale,
  children,
}: {
  dictionary: Dictionary;
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ dictionary, locale }), [dictionary, locale]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useTranslations(): Translator {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslations must be used inside I18nProvider");

  return useMemo(
    () => createTranslator(context.dictionary, context.locale),
    [context.dictionary, context.locale],
  );
}

export function useLocale(): Locale {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useLocale must be used inside I18nProvider");
  return context.locale;
}
