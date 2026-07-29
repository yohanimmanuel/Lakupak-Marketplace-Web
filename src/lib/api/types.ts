/**
 * Shapes returned by the Laku Dashboard GraphQL query `mobileMarketplaceProducts`.
 * Kept aligned with Laku-Marketplace/services/marketplace.ts so both clients agree.
 */

export type OfferBadge = "Discount" | "Promotion" | "All Offers" | "Offer";

export type PromotionDetails = {
  minQuantity: number;
  freeQuantity: number;
  description?: string;
  /** Defaults to after_moq when omitted (legacy offers / order snapshots). */
  applyMode?: "from_zero" | "after_moq";
  /** Sometimes embedded in order promotionDetailsSnapshot for MOQ. */
  moq?: number | null;
};

export type SellerCompany = {
  name?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  industryType?: string;
  pickupAddress?: string;
  logo?: string;
  bannerImage?: string;
};

export type Seller = {
  name?: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  isOfficial?: boolean;
  responseTime?: string;
  deliverySpeed?: string;
  returnPolicy?: string;
  company?: SellerCompany | null;
};

export type ShippingOption = {
  available: boolean;
  minDays?: number | null;
  maxDays?: number | null;
};

export type Shipping = {
  preferences?: string[];
  selfPickup?: ShippingOption;
  sellerDelivery?: ShippingOption;
  buyerCourier?: ShippingOption;
  leadTimeMinDays?: number | null;
  leadTimeMaxDays?: number | null;
};

export type Assurance = {
  halalCertified?: boolean;
  bpomApproved?: boolean;
  returnPolicyDays?: number;
  originalProduct?: boolean;
};

export type ProductVariantDefinition = {
  id: number;
  variantType: string;
  options: string[];
};

export type ProductVariantOption = {
  id: number;
  sku?: string | null;
  sellingPrice?: number | null;
  originalSellingPrice?: number | null;
  moq?: number | null;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  stockStatus?: string | null;
  attributes?: Record<string, string> | null;
  isDefault?: boolean | null;
  isActive?: boolean | null;
};

export type MarketplaceProduct = {
  id: string;
  name: string;
  description: string;
  userId?: number | null;
  sellingPrice: number;
  originalSellingPrice?: number | null;
  discount: number;
  offerBadge?: OfferBadge | null;
  hasActiveOffer: boolean;
  offerName?: string | null;
  discountType?: "percentage" | "fixed" | "buy_x_get_y" | null;
  discountValue?: number | null;
  promotionDetails?: PromotionDetails | null;
  rating: number;
  reviewCount: number;
  soldCount: string;
  stock: number;
  stockStatus: string;
  images: string[];
  category: string;
  productCategory: string;
  salesChannel?: string | null;
  brand?: string | null;
  unit?: string | null;
  sku?: string | null;
  packageType?: string | null;
  piecesPerPackage?: number | null;
  /** Minimum order quantity in pieces, from the default variant option. */
  moq?: number | null;
  publishedAt?: string | null;
  seller?: Seller | null;
  shipping?: Shipping | null;
  shippingInfo?: { location?: string } | null;
  assurance?: Assurance | null;
  reviews?: ReviewsSummary | null;
  variants?: ProductVariantDefinition[];
  variantOptions?: ProductVariantOption[];
};

export type ReviewsSummary = {
  overallRating?: number;
  totalReviews?: number;
  hasReviews?: boolean;
};

export type Facet = { value: string; count: number };

export type Pagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export type ProductsResult = {
  products: MarketplaceProduct[];
  pagination: Pagination;
  facets: { productTypes: Facet[]; productCategories: Facet[] };
  didYouMean: string | null;
};

export type ProductReview = {
  id: number;
  rating: number;
  title?: string;
  comment?: string;
  imageUrls: string[];
  createdAt: string;
  reviewerDisplayName: string;
  reviewerProfileImage?: string;
  purchasedProductName?: string;
  purchasedVariantName?: string;
  purchasedPackage?: string;
};

export type ProductReviews = {
  productId: string;
  totalReviews: number;
  overallRating: number;
  breakdown: Record<number, number>;
  reviews: ProductReview[];
  page?: number;
  limit?: number;
  totalPages?: number;
};

/** Public promotions feed: GET /api/marketplace/latest-updates */
export type LatestUpdate = {
  id: number;
  title: string;
  body: string;
  category?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  publishedAt?: string | null;
};

/** Auth sale banners: GET /api/mobile/offers (JWT required). */
export type MarketplaceHomeOffer = {
  id: number;
  title: string;
  subtitle: string;
  discountText: string;
  endDateText: string;
  backgroundColor: string;
  textColor: string;
  detailsBody: string;
  bannerImageUrl: string | null;
  customBannerImageUrl: string | null;
  publishedAt: string | null;
};

export type Distributor = {
  id: number;
  name?: string;
  logo?: string | null;
  bannerImage?: string | null;
  companyName?: string | null;
  followersCount?: number;
  businessRegistrationNumber?: string | null;
  industryType?: string | null;
  businessDescription?: string | null;
  yearsInOperation?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  shippingPreferences?: string[];
  deliveryTimeSlots?: string[];
  preferredDeliveryDays?: string[];
  pickupAddress?: string | null;
};

export type DistributorReview = {
  id: number;
  overallRating: number;
  comment?: string;
  createdAt: string;
  reviewerDisplayName: string;
  reviewerProfileImage?: string;
  wouldOrderAgain?: string;
};

export type DistributorReviews = {
  distributorId: number;
  totalReviews: number;
  overallRating: number;
  reviews: DistributorReview[];
};

/**
 * Order shapes follow GET /api/mobile/orders, which spreads the Prisma row and
 * therefore carries the numeric id and payment proof state that the GraphQL
 * Order type leaves out. Both are needed by the pay flow.
 */
export type OrderItem = {
  productId?: string | null;
  productName?: string | null;
  images?: string[] | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  packageQuantity?: number | null;
  packageType?: string | null;
  piecesPerPackage?: number | null;
  pricePerPackage?: number | null;
  subtotal: number;
  offerApplied?: boolean | null;
  offerNameSnapshot?: string | null;
  offerBadgeSnapshot?: string | null;
  originalPriceSnapshot?: number | null;
  discountAmount?: number | null;
  variantNameSnapshot?: string | null;
  productDeleted?: boolean | null;
  promotionDetailsSnapshot?: string | null;
  moqSnapshot?: number | null;
};

export type OrderCompany = {
  name?: string | null;
  logo?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  industryType?: string | null;
};

export type OrderSeller = {
  id?: number | null;
  name?: string | null;
  company?: OrderCompany | null;
};

export type Order = {
  id: number;
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  paymentTerms?: string | null;
  deliveryMethod?: string | null;
  deliveryOption?: string | null;
  shippingMethodLabel?: string | null;
  shippingMethod?: string | null;
  subtotal: number;
  discounts: number;
  shippingFee: number;
  totalAmount: number;
  totalOrders?: number | null;
  orderDate: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  receivedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  returnStatus?: string | null;
  returnedAt?: string | null;
  estimatedDeliveryDate?: string | null;
  estimatedDeliveryMinDays?: number | null;
  estimatedDeliveryMaxDays?: number | null;
  preferredDeliveryDate?: string | null;
  preferredDeliveryTime?: string | null;
  preferredPickupDate?: string | null;
  preferredPickupTime?: string | null;
  trackingNumber?: string | null;
  assignedLogistics?: string | null;
  deliveryNote?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  customerEmail?: string | null;
  storeName?: string | null;
  deliveryAddress?: string | null;
  paymentProofUrls?: string[] | null;
  paymentProofFileNames?: string[] | null;
  paymentProofSubmittedAt?: string | null;
  userId?: number | null;
  user?: OrderSeller | null;
  orderItems: OrderItem[];
};

export type OrdersResult = {
  orders: Order[];
  pagination: Pagination;
  /** True when the stored marketplace token was rejected. */
  expired: boolean;
};

export type SellerBank = {
  sellerUserId: number;
  companyName: string;
  billingBankName: string | null;
  billingBankAccountName: string | null;
  billingBankAccountNumber: string | null;
  buyerPaymentTermDays: number | null;
};

/** GraphQL mobileCart item. productData is the snapshot the client stored on add. */
export type CartItem = {
  id: number;
  productId: string;
  productData: MarketplaceProduct;
  metadata?: { quantity?: number; variant?: string; selected?: boolean } | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivityType = "favorite" | "viewed" | "purchased" | "cart";

export type UserActivity = {
  id: number;
  productId: string;
  productData: MarketplaceProduct;
  activityType: ActivityType;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  id: number;
  username: string;
  name?: string | null;
  storeName?: string | null;
  email?: string | null;
  bio?: string | null;
  phone?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  chosenAddress?: string | null;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  address?: string;
};
