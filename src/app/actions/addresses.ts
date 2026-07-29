"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/app/actions/cart";
import { getTranslations } from "@/i18n/server";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  type AddressInput,
} from "@/lib/api/addresses";
import { updateProfile } from "@/lib/api/profile";
import { getSession } from "@/lib/auth/session";

function readAddressInput(formData: FormData): AddressInput {
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    label: String(formData.get("label") ?? "home").trim() || "home",
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
  };
}

export async function saveAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) {
    return { ok: false, error: t("checkout.errors.sessionExpired") };
  }

  const input = readAddressInput(formData);
  if (!input.fullName || !input.phone || !input.address) {
    return { ok: false, error: t("addresses.errors.required") };
  }

  const addressIdRaw = String(formData.get("addressId") ?? "").trim();
  const addressId = addressIdRaw ? Number.parseInt(addressIdRaw, 10) : null;

  const result =
    addressId && Number.isFinite(addressId)
      ? await updateAddress({
          userId: session.user.id,
          token: session.token,
          addressId,
          input,
        })
      : await createAddress({
          userId: session.user.id,
          token: session.token,
          input,
        });

  if (!result.ok) {
    return { ok: false, error: result.error ?? t("addresses.errors.save") };
  }

  if (input.isDefault) {
    await updateProfile({
      userId: session.user.id,
      token: session.token,
      input: {
        name: input.fullName,
        phone: input.phone,
        chosenAddress: input.address,
      },
    });
  }

  revalidatePath("/account/addresses");
  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/checkout");
  return { ok: true, message: t("addresses.saved") };
}

export async function deleteAddressAction(
  addressId: number,
): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) {
    return { ok: false, error: t("checkout.errors.sessionExpired") };
  }

  const result = await deleteAddress({
    userId: session.user.id,
    token: session.token,
    addressId,
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? t("addresses.errors.delete") };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/account");
  return { ok: true, message: t("addresses.deleted") };
}
