"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/app/actions/cart";
import { getTranslations } from "@/i18n/server";
import { updateProfile, type ProfileInput } from "@/lib/api/profile";
import { getSession } from "@/lib/auth/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  const read = (key: string) => String(formData.get(key) ?? "").trim();

  const username = read("username");
  const email = read("email");

  if (!username) return { ok: false, error: t("profile.errors.username") };
  if (email && !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: t("profile.errors.email") };
  }

  const image = read("image");

  const input: ProfileInput = {
    username,
    // Left out entirely when empty so a missing upload cannot wipe the avatar.
    ...(image ? { image } : {}),
    name: read("name"),
    storeName: read("storeName"),
    email,
    phone: read("phone"),
    bio: read("bio"),
    chosenAddress: read("chosenAddress"),
    country: read("country"),
  };

  const result = await updateProfile({
    userId: session.user.id,
    token: session.token,
    input,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true, message: t("profile.saved") };
}
