"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { useTranslations } from "@/i18n/client";

type Props = {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  /** When true, call onChange on each keystroke (PDP and cart totals). */
  updateOnType?: boolean;
};

/** Stepper whose middle field is a real number input, so a buyer can type "24". */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  disabled = false,
  size = "md",
  updateOnType = false,
}: Props) {
  const t = useTranslations();
  const [draft, setDraft] = useState(String(value));
  const focusedRef = useRef(false);

  // Sync from parent (+/−, cart refresh) without overwriting digits mid-keystroke.
  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value));
  }, [value]);

  const clamp = (quantity: number) => Math.min(max, Math.max(min, quantity));

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? clamp(parsed) : clamp(value);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const handleTyped = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setDraft(digits);

    if (!updateOnType || digits === "") return;

    const parsed = Number.parseInt(digits, 10);
    if (!Number.isFinite(parsed)) return;

    // Soft-cap only at max so typing "50" isn't forced up to min mid-way.
    const next = Math.min(max, parsed);
    if (next !== value) onChange(next);
  };

  const buttonSize = size === "sm" ? "size-8" : "size-10";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const fieldSize =
    size === "sm" ? "h-8 w-11 text-sm font-semibold" : "h-10 w-14 text-base font-bold";

  return (
    <div className="inline-flex items-center rounded-lg border border-laku-line">
      <button
        type="button"
        aria-label={t("product.decrease")}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={`flex ${buttonSize} items-center justify-center text-laku-muted transition-colors hover:text-laku-blue disabled:opacity-40`}
      >
        <Minus className={iconSize} aria-hidden />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        disabled={disabled}
        aria-label={t("product.quantityAria")}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(event) => handleTyped(event.target.value)}
        onBlur={(event) => {
          focusedRef.current = false;
          commit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`${fieldSize} border-x border-laku-line bg-transparent text-center text-laku-ink outline-none focus:bg-laku-surface disabled:opacity-50`}
      />

      <button
        type="button"
        aria-label={t("product.increase")}
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className={`flex ${buttonSize} items-center justify-center text-laku-muted transition-colors hover:text-laku-blue disabled:opacity-40`}
      >
        <Plus className={iconSize} aria-hidden />
      </button>
    </div>
  );
}
