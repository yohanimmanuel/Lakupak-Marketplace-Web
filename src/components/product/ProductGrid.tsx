import type { MarketplaceProduct } from "@/lib/api/types";

import ProductCard from "./ProductCard";

type Props = {
  products: MarketplaceProduct[];
  priorityCount?: number;
  appendOrderId?: string | null;
};

export default function ProductGrid({ products, priorityCount = 0, appendOrderId }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
          appendOrderId={appendOrderId}
        />
      ))}
    </div>
  );
}
