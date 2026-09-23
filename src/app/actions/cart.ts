"use server";

import { revalidatePath } from "next/cache";

import { addToCart, getCart, removeCartItem, updateCartItem } from "@/lib/api/cart";
import { getProductById } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";
import { getMinPackageQuantity } from "@/lib/checkout";
import { getTranslations } from "@/i18n/server";

export type ActionState = { ok: boolean; error?: string; message?: string };

export async function addToCartAction(
  productId: string,
  quantity: number,
  variant?: string,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const t = await getTranslations();

  const product = await getProductById(productId);
  if (!product) return { ok: false, error: t("checkout.errors.productMissing") };

  // One PO = one distributor: block mixing sellers in the same cart.
  const existing = await getCart({ userId: session.user.id, token: session.token });
  if (existing.length > 0) {
    const incomingKey =
      product.userId != null && Number.isFinite(product.userId)
        ? String(product.userId)
        : product.seller?.company?.name?.trim() ||
          product.seller?.name?.trim() ||
          "unknown";
    for (const item of existing) {
      const pdata = item.productData;
      const existingKey =
        pdata?.userId != null && Number.isFinite(pdata.userId)
          ? String(pdata.userId)
          : pdata?.seller?.company?.name?.trim() ||
            pdata?.seller?.name?.trim() ||
            "unknown";
      if (existingKey !== incomingKey) {
        return { ok: false, error: t("cart.singleDistributorOnly") };
      }
    }
  }

  const variantLabel = variant?.trim() || "Default";
  const minQuantity = getMinPackageQuantity(product, variantLabel);
  const result = await addToCart({
    userId: session.user.id,
    token: session.token,
    product,
    quantity: Math.max(minQuantity, Math.trunc(quantity) || 1),
    variant: variantLabel,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItemAction(
  cartItemId: number,
  quantity: number,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const result =
    quantity < 1
      ? await removeCartItem({ cartItemId, token: session.token })
      : await updateCartItem({
          cartItemId,
          token: session.token,
          quantity: Math.trunc(quantity),
        });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(cartItemId: number): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const result = await removeCartItem({ cartItemId, token: session.token });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}
