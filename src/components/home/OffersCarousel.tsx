"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MarketplaceHomeOffer } from "@/lib/api/types";

type Props = {
  offers: MarketplaceHomeOffer[];
};

/** Web version of the app's SaleBanner rail — Admin Offers only, not announcements. */
export default function OffersCarousel({ offers }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const slideWidth = rail.scrollWidth / offers.length;
    setActiveIndex(Math.round(rail.scrollLeft / slideWidth));
  }, [offers.length]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", handleScroll, { passive: true });
    return () => rail.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (offers.length === 0) return null;

  return (
    <div>
      <div
        ref={railRef}
        className="laku-rail flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:px-0"
      >
        {offers.map((offer, index) => {
          const hero =
            offer.customBannerImageUrl || offer.bannerImageUrl || null;
          return (
            <Link
              key={offer.id}
              href={`/offers/${offer.id}`}
              className="relative h-45 w-[min(100%,42rem)] shrink-0 snap-start overflow-hidden rounded-2xl text-white transition-transform duration-200 hover:-translate-y-0.5 md:h-50"
              style={{
                backgroundColor: offer.backgroundColor,
                color: offer.textColor,
              }}
            >
              {hero ? (
                <>
                  <Image
                    src={hero}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 42rem, 100vw"
                    className="object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    unoptimized
                  />
                  {!offer.customBannerImageUrl ? (
                    <span
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(90deg, ${offer.backgroundColor}ee, ${offer.backgroundColor}66, transparent)`,
                      }}
                    />
                  ) : null}
                </>
              ) : null}

              <div className="relative z-10 flex h-full flex-col justify-center gap-2 p-6 md:p-8">
                {offer.discountText ? (
                  <span className="inline-flex w-fit rounded bg-black/20 px-2 py-0.5 text-xs font-bold">
                    {offer.discountText}
                  </span>
                ) : null}
                <h3 className="max-w-md text-xl font-bold text-balance md:text-2xl">
                  {offer.title}
                </h3>
                {offer.subtitle ? (
                  <p className="line-clamp-2 max-w-md text-sm/6 opacity-90">
                    {offer.subtitle}
                  </p>
                ) : null}
                {offer.endDateText ? (
                  <p className="text-xs opacity-80">{offer.endDateText}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      {offers.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {offers.map((offer, index) => (
            <span
              key={offer.id}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === activeIndex ? "w-4 bg-laku-blue" : "w-1.5 bg-[#d1d5db]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
