"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

import { setLocaleAction } from "@/app/actions/locale";
import { LANGUAGE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/client";

/** Same two-row list the app shows: native label, checkmark, no flags. */
export default function LanguageOptions({ current }: { current: Locale }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Locale>(current);

  const select = (locale: Locale) => {
    if (locale === selected || pending) return;

    setSelected(locale);
    startTransition(async () => {
      const result = await setLocaleAction(locale);
      if (!result.ok) {
        setSelected(current);
        return;
      }
      // Soft refresh leaves some client trees on the old dictionary; a full
      // reload matches the app's expo-updates reload after a language change.
      window.location.reload();
    });
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white">
      {SUPPORTED_LOCALES.map((locale) => {
        const active = selected === locale;

        return (
          <button
            key={locale}
            type="button"
            disabled={pending}
            onClick={() => select(locale)}
            aria-pressed={active}
            className={`flex w-full items-center gap-3 border-b border-[#f3f4f6] px-5 py-4 text-left transition-colors last:border-b-0 disabled:opacity-60 ${
              active ? "bg-laku-blue/8" : "hover:bg-laku-blue/5"
            }`}
          >
            <span className="flex-1 text-sm font-medium text-laku-ink">
              {LANGUAGE_LABELS[locale]}
            </span>
            <Check
              className={`size-4 text-laku-blue ${active ? "opacity-100" : "opacity-0"}`}
              aria-label={active ? t("settings.selected") : t("settings.notSelected")}
            />
          </button>
        );
      })}
    </div>
  );
}
