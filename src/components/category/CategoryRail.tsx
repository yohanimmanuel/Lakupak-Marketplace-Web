"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { BrowseCategory } from "@/lib/categories";
import { getCategoryImageSrc } from "@/lib/categories";

import CategoryIcon from "./CategoryIcon";

type Props = {
  categories: BrowseCategory[];
  /** `directory` = Shopee-style 2-row bordered grid; `grid` = simple wrap. */
  layout?: "directory" | "grid";
};

const COLS_PER_PAGE = {
  mobile: 4,
  desktop: 8,
} as const;

function CategoryCell({ category }: { category: BrowseCategory }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(category.label)}&category=${encodeURIComponent(category.name)}`}
      className="group flex min-h-[118px] flex-col items-center justify-start gap-2 border-r border-b border-laku-line bg-white px-2 py-3 text-center transition-colors hover:bg-laku-surface focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-laku-blue sm:min-h-[128px]"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-[#f5f5f5] transition-colors duration-200 group-hover:bg-laku-blue/10 sm:size-16">
        <CategoryIcon
          name={category.icon}
          categoryName={category.name}
          className={
            getCategoryImageSrc(category.name)
              ? "size-10 object-contain transition-transform duration-200 group-hover:scale-110 sm:size-11"
              : "size-7 text-laku-blue transition-transform duration-200 group-hover:scale-110 sm:size-8"
          }
        />
      </span>
      <span className="line-clamp-2 max-w-[5.5rem] text-[11px] leading-snug font-medium text-[#555] sm:max-w-[6.5rem] sm:text-xs">
        {category.label}
      </span>
    </Link>
  );
}

/**
 * Shopee-style categories: white panel, hairline grid, 2 rows × N columns,
 * horizontal page scroll with side chevrons.
 */
export default function CategoryRail({
  categories,
  layout = "directory",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [categories.length, updateArrows]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cols =
      window.matchMedia("(min-width: 768px)").matches
        ? COLS_PER_PAGE.desktop
        : COLS_PER_PAGE.mobile;
    const cellWidth = el.scrollWidth / Math.ceil(categories.length / 2);
    el.scrollBy({ left: direction * cellWidth * cols, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  if (layout === "grid") {
    return (
      <div className="overflow-hidden rounded-xl border border-laku-line bg-white">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {categories.map((category) => (
            <CategoryCell key={category.name} category={category} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 md:px-0">
      <div className="overflow-hidden rounded-xl border border-laku-line bg-white">
        <div
          ref={scrollerRef}
          className="laku-rail grid grid-flow-col grid-rows-2 overflow-x-auto scroll-smooth"
          style={{
            gridAutoColumns: "minmax(100px, 12.5%)",
          }}
        >
          {categories.map((category) => (
            <CategoryCell key={category.name} category={category} />
          ))}
        </div>
      </div>

      {canPrev ? (
        <button
          type="button"
          aria-label="Previous categories"
          onClick={() => scrollByPage(-1)}
          className="absolute top-1/2 left-1 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-laku-line bg-white text-laku-ink shadow-md transition-colors hover:bg-laku-surface md:-left-3 md:size-9"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      ) : null}

      {canNext ? (
        <button
          type="button"
          aria-label="Next categories"
          onClick={() => scrollByPage(1)}
          className="absolute top-1/2 right-1 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-laku-line bg-white text-laku-ink shadow-md transition-colors hover:bg-laku-surface md:-right-3 md:size-9"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
