import type { MarketplaceProduct } from "@/lib/api/types";

export type EditCartLine = {
  productId: string;
  quantity: number;
  variant: string;
  product: MarketplaceProduct;
};

type EditCartState = {
  orderId: string;
  items: EditCartLine[];
};

const STORAGE_KEY = "lakuEditCart";
const COOKIE = "laku_edit_order";
const CHANGE_EVENT = "laku-edit-cart";

let browserBack = false;

/** True for the render that follows the browser Back or Forward button. */
export function markBrowserBack() {
  browserBack = true;
}

export function landedByBrowserBack() {
  return browserBack;
}

export function clearBrowserBack() {
  browserBack = false;
}

function notifyEditCart() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeEditCart(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

let cachedRaw: string | null = null;
let cachedState: EditCartState | null = null;

/** Stable snapshot for useSyncExternalStore. */
export function getEditCartSnapshot(): EditCartState | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  if (!raw) {
    cachedState = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<EditCartState>;
    cachedState =
      parsed.orderId && Array.isArray(parsed.items)
        ? { orderId: parsed.orderId, items: parsed.items }
        : null;
  } catch {
    cachedState = null;
  }
  return cachedState;
}

export function getEditCartServerSnapshot(): EditCartState | null {
  return null;
}

function writeCookie(orderId: string) {
  document.cookie = `${COOKIE}=${encodeURIComponent(orderId)}; path=/; max-age=86400; samesite=lax`;
}

function clearCookie() {
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function readEditCart(): EditCartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EditCartState>;
    if (!parsed.orderId || !Array.isArray(parsed.items)) return null;
    return { orderId: parsed.orderId, items: parsed.items };
  } catch {
    return null;
  }
}

function saveEditCart(state: EditCartState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  writeCookie(state.orderId);
  notifyEditCart();
}

/** Hides the normal cart for this order. A second call for the same order keeps its products. */
export function beginEditCart(orderId: string) {
  if (typeof window === "undefined") return;
  const id = orderId.trim();
  if (!id) return;
  const current = readEditCart();
  if (current?.orderId === id) {
    writeCookie(id);
    return;
  }
  saveEditCart({ orderId: id, items: [] });
}

/** Drops only the products added during the edit and brings the normal cart back. */
export function endEditCart() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  clearCookie();
  notifyEditCart();
}

export function addEditCartItem(input: {
  product: MarketplaceProduct;
  quantity: number;
  variant?: string;
}) {
  const current = readEditCart();
  if (!current) return;
  const variant = input.variant?.trim() || "Default";
  const items = [...current.items];
  const index = items.findIndex(
    (item) => item.productId === input.product.id && item.variant === variant,
  );
  if (index >= 0) {
    items[index] = {
      ...items[index],
      quantity: items[index].quantity + input.quantity,
      product: input.product,
    };
  } else {
    items.unshift({
      productId: input.product.id,
      quantity: input.quantity,
      variant,
      product: input.product,
    });
  }
  saveEditCart({ orderId: current.orderId, items });
}

export function updateEditCartLine(productId: string, variant: string, quantity: number) {
  const current = readEditCart();
  if (!current) return;
  const items =
    quantity < 1
      ? current.items.filter((item) => !(item.productId === productId && item.variant === variant))
      : current.items.map((item) =>
          item.productId === productId && item.variant === variant
            ? { ...item, quantity }
            : item,
        );
  saveEditCart({ orderId: current.orderId, items });
}
