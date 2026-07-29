"use server";

import { revalidatePath } from "next/cache";

import { addUserActivity, deleteUserActivity } from "@/lib/api/activity";
import { getProductById } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";
import type { ActionState } from "@/app/actions/cart";

export async function toggleFavoriteAction(
  productId: string,
  shouldFavorite: boolean,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  if (!shouldFavorite) {
    const removed = await deleteUserActivity({
      userId: session.user.id,
      token: session.token,
      productId,
      type: "favorite",
    });
    if (!removed.ok) return { ok: false, error: removed.error };
    revalidatePath("/account/favourites");
    return { ok: true };
  }

  const product = await getProductById(productId);
  if (!product) return { ok: false, error: "Produk tidak ditemukan." };

  const result = await addUserActivity({
    userId: session.user.id,
    token: session.token,
    product,
    type: "favorite",
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/account/favourites");
  return { ok: true };
}

/** Fired once per product page open, mirroring the app's view tracking. */
export async function recordProductViewAction(productId: string): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const product = await getProductById(productId);
  if (!product) return { ok: false, error: "Produk tidak ditemukan." };

  await addUserActivity({
    userId: session.user.id,
    token: session.token,
    product,
    type: "viewed",
  });

  return { ok: true };
}
