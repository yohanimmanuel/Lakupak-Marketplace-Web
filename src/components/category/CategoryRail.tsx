import Link from "next/link";

import type { BrowseCategory } from "@/lib/categories";

import CategoryIcon from "./CategoryIcon";

type Props = {
  categories: BrowseCategory[];
  /** Rails scroll like the app; grids suit the dedicated categories page. */
  layout?: "rail" | "grid";
};

export default function CategoryRail({ categories, layout = "rail" }: Props) {
  if (categories.length === 0) return null;

  const containerClass =
    layout === "rail"
      ? "laku-rail flex gap-4 overflow-x-auto px-4 pb-1 md:px-0"
      : "grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8";

  return (
    <div className={containerClass}>
      {categories.map((category) => (
        <Link
          key={category.name}
          href={`/search?q=${encodeURIComponent(category.label)}&category=${encodeURIComponent(category.name)}`}
          className="group flex min-w-20 shrink-0 flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-laku-blue"
        >
          <span className="flex size-16 items-center justify-center rounded-xl bg-laku-chip transition-colors duration-200 group-hover:bg-laku-blue/10">
            <CategoryIcon
              name={category.icon}
              className="size-7 text-laku-blue transition-transform duration-200 group-hover:scale-110"
            />
          </span>
          <span className="max-w-24 text-center text-xs font-medium text-laku-ink">
            {category.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
