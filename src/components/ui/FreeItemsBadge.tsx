import { Gift } from "lucide-react";

/** Compact badge for promotional free quantity earned on the current line. */
export default function FreeItemsBadge({
  count,
  label,
  className = "",
}: {
  count: number;
  label: string;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <p
      className={`inline-flex items-center gap-1 rounded-[4px] bg-laku-promo-bg px-1.5 py-0.5 text-[11px] font-semibold text-laku-promo-ink ${className}`}
    >
      <Gift className="size-3 shrink-0" aria-hidden />
      {label}
    </p>
  );
}
