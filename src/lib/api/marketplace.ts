import "server-only";

import { graphqlRequest, restRequest } from "@/lib/api/graphql";
import type {
  Distributor,
  Facet,
  LatestUpdate,
  MarketplaceProduct,
  Pagination,
  ProductReviews,
  ProductVariantOption,
  ProductsResult,
} from "@/lib/api/types";
import {
  normalizeVariantDefinitions,
  normalizeVariantOptions,
} from "@/lib/variants";

const PRODUCT_FIELDS = `
  id
  name
  description
  userId
  sellingPrice
  originalSellingPrice
  price
  originalPrice
  offerBadge
  hasActiveOffer
  offerName
  discountType
  discountValue
  promotionDetails
  rating
  reviewCount
  soldCount
  stock
  stockStatus
  images
  category
  productCategory
  salesChannel
  brand
  unit
  sku
  publishedAt
  piecesPerPackage
  packageType
  stockUnit
  variants
  variantOptionsFormatted
  seller {
    name
    avatar
    rating
    reviewCount
    isOfficial
    responseTime
    deliverySpeed
    returnPolicy
    company {
      name
      businessAddress
      businessPhone
      businessEmail
      industryType
      pickupAddress
      logo
      bannerImage
    }
  }
  shipping {
    preferences
    selfPickup { available minDays maxDays }
    sellerDelivery { available minDays maxDays }
    buyerCourier { available minDays maxDays }
    leadTimeMinDays
    leadTimeMaxDays
  }
  shippingInfo { location }
  assurance {
    halalCertified
    bpomApproved
    returnPolicyDays
    originalProduct
  }
  reviews {
    overallRating
    totalReviews
    hasReviews
  }
`;

const PRODUCTS_QUERY = `
  query WebMarketplaceProducts(
    $page: Int
    $limit: Int
    $category: String
    $search: String
    $productId: String
    $marketplaceUserId: Int
  ) {
    mobileMarketplaceProducts(
      page: $page
      limit: $limit
      category: $category
      search: $search
      productId: $productId
      marketplaceUserId: $marketplaceUserId
    ) {
      nodes { ${PRODUCT_FIELDS} }
      pagination { page limit totalCount totalPages }
      facets {
        productTypes { value count }
        productCategories { value count }
      }
      didYouMean
    }
  }
`;

type RawProduct = Omit<
  MarketplaceProduct,
  "discount" | "moq" | "variants" | "variantOptions"
> & {
  price?: number;
  originalPrice?: number;
  discount?: number;
  variants?: unknown[] | null;
  variantOptionsFormatted?: ProductVariantOption[] | null;
};

/** Same default-variant pick the mobile Buy Now modal uses for MOQ and stock. */
function resolveDefaultVariant(
  options?: ProductVariantOption[] | null,
): ProductVariantOption | null {
  if (!Array.isArray(options) || options.length === 0) return null;
  return options.find((option) => option.isDefault) ?? options[0] ?? null;
}

function resolveMoq(options?: ProductVariantOption[] | null): number | null {
  const moq = Number(resolveDefaultVariant(options)?.moq);
  return Number.isFinite(moq) && moq > 0 ? moq : null;
}

type ProductsQueryData = {
  mobileMarketplaceProducts: {
    nodes: RawProduct[];
    pagination: Pagination;
    facets: { productTypes: Facet[]; productCategories: Facet[] };
    didYouMean: string | null;
  };
};

/** Same derivation the mobile client applies after fetching. */
function normalizeProduct(raw: RawProduct): MarketplaceProduct {
  const sellingPrice = Number(raw.sellingPrice) || 0;
  // originalPrice from the API is purchase/cost — never use it as a compare-at price.
  const originalSellingPrice = Number(raw.originalSellingPrice) || 0;
  const discount =
    originalSellingPrice > sellingPrice
      ? Math.round(((originalSellingPrice - sellingPrice) / originalSellingPrice) * 100)
      : 0;

  const { variantOptionsFormatted, variants: rawVariants, ...rest } = raw;
  const variantOptions = normalizeVariantOptions(variantOptionsFormatted);
  const variants = normalizeVariantDefinitions(rawVariants);

  return {
    ...rest,
    sellingPrice,
    originalSellingPrice,
    discount,
    moq: resolveMoq(variantOptions),
    variants,
    variantOptions,
    images: Array.isArray(raw.images) ? raw.images.filter(Boolean) : [],
    soldCount: raw.soldCount ?? "0",
  };
}

export const EMPTY_RESULT: ProductsResult = {
  products: [],
  pagination: { page: 1, limit: 0, totalCount: 0, totalPages: 0 },
  facets: { productTypes: [], productCategories: [] },
  didYouMean: null,
};

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  marketplaceUserId?: number;
}): Promise<ProductsResult> {
  const data = await graphqlRequest<ProductsQueryData>(
    PRODUCTS_QUERY,
    {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      category: params?.category,
      search: params?.search,
      marketplaceUserId: params?.marketplaceUserId,
    },
    { revalidate: params?.search ? 30 : 60 },
  );

  const connection = data.mobileMarketplaceProducts;

  return {
    products: (connection.nodes ?? []).map(normalizeProduct),
    pagination: connection.pagination,
    facets: connection.facets ?? { productTypes: [], productCategories: [] },
    didYouMean: connection.didYouMean ?? null,
  };
}

/** Never throws: browse surfaces degrade to an empty state instead of a 500. */
export async function getProductsSafe(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  marketplaceUserId?: number;
}): Promise<ProductsResult> {
  try {
    return await getProducts(params);
  } catch {
    return EMPTY_RESULT;
  }
}

/**
 * GraphQL accepts `marketplaceUserId` but currently only logs it for search
 * analytics — it does not filter nodes. Mirror the mobile shop screen: page
 * through products and keep those owned by the distributor `userId`.
 */
export async function getProductsBySeller(
  sellerUserId: number,
  options?: { maxPages?: number; limit?: number; maxProducts?: number },
): Promise<MarketplaceProduct[]> {
  const maxPages = options?.maxPages ?? 6;
  const limit = options?.limit ?? 50;
  const maxProducts = options?.maxProducts ?? 80;
  const matches: MarketplaceProduct[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await getProductsSafe({ page, limit });
    for (const product of result.products) {
      if (product.userId === sellerUserId) matches.push(product);
    }
    if (matches.length >= maxProducts) break;
    if (page >= (result.pagination.totalPages || page)) break;
  }

  return matches.slice(0, maxProducts);
}

export async function getProductById(
  productId: string,
): Promise<MarketplaceProduct | null> {
  try {
    const data = await graphqlRequest<ProductsQueryData>(
      PRODUCTS_QUERY,
      { productId, limit: 1, page: 1 },
      { revalidate: 60 },
    );
    const node = data.mobileMarketplaceProducts.nodes?.[0];
    return node ? normalizeProduct(node) : null;
  } catch {
    return null;
  }
}

export async function getProductReviews(
  productId: string,
  options?: { page?: number; limit?: number },
): Promise<ProductReviews | null> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  try {
    return await restRequest<ProductReviews>(
      `/api/mobile/reviews/product?productId=${encodeURIComponent(productId)}&page=${page}&limit=${limit}`,
      { revalidate: 300 },
    );
  } catch {
    return null;
  }
}

export async function getDistributor(userId: number): Promise<Distributor | null> {
  try {
    return await restRequest<Distributor>(`/api/mobile/distributor/${userId}`, {
      revalidate: 300,
    });
  } catch {
    return null;
  }
}

/**
 * Public promotions feed. The mobile home banners (/api/mobile/offers) require a
 * JWT, so logged-out visitors get the published announcements feed instead.
 */
export async function getLatestUpdates(options?: {
  limit?: number;
  category?: string;
  distributorId?: number | null;
}): Promise<LatestUpdate[]> {
  const params = new URLSearchParams({ limit: String(options?.limit ?? 6) });
  if (options?.category) params.set("category", options.category);
  if (options?.distributorId != null && options.distributorId > 0) {
    params.set("distributorId", String(options.distributorId));
  }

  try {
    const data = await restRequest<{ announcements?: LatestUpdate[] }>(
      `/api/marketplace/latest-updates?${params.toString()}`,
      { revalidate: 300 },
    );
    return (data.announcements ?? []).slice(0, options?.limit ?? 6);
  } catch {
    return [];
  }
}

export async function getLatestUpdate(
  id: number,
  distributorId?: number | null,
): Promise<LatestUpdate | null> {
  const params = new URLSearchParams();
  if (distributorId != null && distributorId > 0) params.set("distributorId", String(distributorId));
  const query = params.toString();
  try {
    const data = await restRequest<{ announcement?: LatestUpdate } | LatestUpdate>(
      `/api/marketplace/latest-updates/${id}${query ? `?${query}` : ""}`,
      { revalidate: 300 },
    );
    if (data && typeof data === "object" && "announcement" in data) {
      return data.announcement ?? null;
    }
    return (data as LatestUpdate) ?? null;
  } catch {
    return null;
  }
}
