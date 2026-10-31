import "server-only";

import { restRequest } from "@/lib/api/graphql";
import type { MarketplaceHomeOffer } from "@/lib/api/types";

export type { MarketplaceHomeOffer };

function normalizeOffer(
  raw: Partial<MarketplaceHomeOffer> | null | undefined,
): MarketplaceHomeOffer | null {
  if (!raw || typeof raw.id !== "number") return null;
  return {
    id: raw.id,
    title: String(raw.title ?? ""),
    subtitle: String(raw.subtitle ?? ""),
    discountText: String(raw.discountText ?? ""),
    endDateText: String(raw.endDateText ?? ""),
    backgroundColor: String(raw.backgroundColor ?? "#0a61d7"),
    textColor: String(raw.textColor ?? "#ffffff"),
    detailsBody: String(raw.detailsBody ?? ""),
    bannerImageUrl: raw.bannerImageUrl ?? null,
    customBannerImageUrl: raw.customBannerImageUrl ?? null,
    publishedAt: raw.publishedAt ?? null,
  };
}

/** Auth-required homepage sale banners for the signed-in storefront. */
export async function getHomeOffersList(
  token: string,
): Promise<MarketplaceHomeOffer[]> {
  try {
    const data = await restRequest<{ offers?: Partial<MarketplaceHomeOffer>[] }>(
      "/api/mobile/offers",
      { token },
    );
    return (data.offers ?? [])
      .map(normalizeOffer)
      .filter((offer): offer is MarketplaceHomeOffer => offer != null);
  } catch {
    return [];
  }
}

export async function getHomeOfferById(
  token: string,
  id: number,
): Promise<MarketplaceHomeOffer | null> {
  try {
    const data = await restRequest<{ offer?: Partial<MarketplaceHomeOffer> }>(
      `/api/mobile/offers/${id}`,
      { token },
    );
    return normalizeOffer(data.offer);
  } catch {
    return null;
  }
}
