import "server-only";

import { graphqlMutate, graphqlRequest, type MutationResult } from "@/lib/api/graphql";
import type { CartItem, MarketplaceProduct } from "@/lib/api/types";

export { getCartLineTotal, getCartQuantity, getCartVariant, isCartItemSelected } from "@/lib/cartPricing";

const CART_ITEM_FIELDS = `
  id
  productId
  productData
  metadata
  createdAt
  updatedAt
`;

const CART_QUERY = `
  query WebMobileCart($userId: Int!) {
    mobileCart(userId: $userId) {
      success
      items { ${CART_ITEM_FIELDS} }
    }
  }
`;

const ADD_TO_CART = `
  mutation WebAddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      success
      message
      cartItem { ${CART_ITEM_FIELDS} }
    }
  }
`;

const UPDATE_CART_ITEM = `
  mutation WebUpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      success
      message
    }
  }
`;

const REMOVE_CART_ITEM = `
  mutation WebRemoveCartItem($cartItemId: Int!) {
    removeCartItem(cartItemId: $cartItemId) {
      success
      message
    }
  }
`;

const CLEAR_CART = `
  mutation WebClearCart($userId: Int!, $trackAbandonment: Boolean) {
    clearCart(userId: $userId, trackAbandonment: $trackAbandonment) {
      success
      message
    }
  }
`;

export async function getCart(params: {
  userId: number;
  token: string;
}): Promise<CartItem[]> {
  try {
    const data = await graphqlRequest<{ mobileCart: { items: CartItem[] } }>(
      CART_QUERY,
      { userId: params.userId },
      { token: params.token },
    );
    // Unpublished products are dropped upstream, so anything returned is orderable.
    return data.mobileCart.items ?? [];
  } catch {
    return [];
  }
}

export async function addToCart(params: {
  userId: number;
  token: string;
  product: MarketplaceProduct;
  quantity: number;
  variant?: string;
}): Promise<MutationResult<unknown>> {
  return graphqlMutate(
    ADD_TO_CART,
    {
      input: {
        userId: params.userId,
        productId: params.product.id,
        productData: params.product,
        quantity: params.quantity,
        variant: params.variant ?? "Default",
      },
    },
    params.token,
  );
}

export async function updateCartItem(params: {
  cartItemId: number;
  token: string;
  quantity?: number;
  selected?: boolean;
}): Promise<MutationResult<unknown>> {
  return graphqlMutate(
    UPDATE_CART_ITEM,
    {
      input: {
        cartItemId: params.cartItemId,
        quantity: params.quantity,
        selected: params.selected,
      },
    },
    params.token,
  );
}

export async function removeCartItem(params: {
  cartItemId: number;
  token: string;
}): Promise<MutationResult<unknown>> {
  return graphqlMutate(REMOVE_CART_ITEM, { cartItemId: params.cartItemId }, params.token);
}

/** trackAbandonment stays false after checkout so the order is not logged as a drop-off. */
export async function clearCart(params: {
  userId: number;
  token: string;
  trackAbandonment?: boolean;
}): Promise<MutationResult<unknown>> {
  return graphqlMutate(
    CLEAR_CART,
    { userId: params.userId, trackAbandonment: params.trackAbandonment ?? false },
    params.token,
  );
}
