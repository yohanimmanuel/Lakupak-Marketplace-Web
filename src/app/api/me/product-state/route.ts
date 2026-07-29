import { NextResponse } from "next/server";

import { getFavoriteIds } from "@/lib/api/activity";
import { getSession } from "@/lib/auth/session";

/**
 * Lets the statically rendered product page hydrate its buyer-specific state
 * without turning the whole route dynamic.
 */
export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId");
  const session = await getSession();

  if (!session || !productId) {
    return NextResponse.json({ signedIn: false, favorite: false });
  }

  const favorites = await getFavoriteIds({
    userId: session.user.id,
    token: session.token,
  });

  return NextResponse.json({
    signedIn: true,
    favorite: favorites.has(productId),
  });
}
