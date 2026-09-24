"use server";

import { revalidatePath } from "next/cache";

import { addToCart, removeCartItem, updateCartItem } from "@/lib/api/cart";
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
