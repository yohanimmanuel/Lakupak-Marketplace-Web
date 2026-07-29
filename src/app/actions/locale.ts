"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isSupportedLocale } from "@/i18n/config";

/** Persists the language the way the app stores its preference, then re-renders. */
export async function setLocaleAction(locale: string): Promise<{ ok: boolean }> {
  if (!isSupportedLocale(locale)) return { ok: false };

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
