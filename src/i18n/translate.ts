import type { Locale } from "@/i18n/config";

export type Dictionary = Record<string, unknown>;

export type TranslateVars = Record<string, string | number>;

export type Translator = {
  (key: string, vars?: TranslateVars): string;
  locale: Locale;
};

function lookup(dictionary: Dictionary, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dictionary,
    );
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Same `t("a.b.c", { count })` contract as i18next in the app, minus the
 * runtime: the dictionary is resolved on the server and passed down.
 */
export function createTranslator(dictionary: Dictionary, locale: Locale): Translator {
  const translate = (key: string, vars?: TranslateVars): string => {
    const value = lookup(dictionary, key);
    // Falling back to the key makes a missing string obvious instead of blank.
    return typeof value === "string" ? interpolate(value, vars) : key;
  };

  translate.locale = locale;
  return translate;
}

/** For data-driven keys (category names, statuses) that may not be in the dictionary. */
export function translateOr(t: Translator, key: string, fallback: string): string {
  const value = t(key);
  return value === key ? fallback : value;
}
