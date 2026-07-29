"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { useTranslations } from "@/i18n/client";

type Props = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  value?: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  inputMode?:
    | "text"
    | "email"
    | "numeric"
    | "tel"
    | "search"
    | "url"
    | "decimal"
    | "none";
};

export default function AuthField({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
  placeholder,
  hint,
  value,
  onChange,
  multiline = false,
  rows = 3,
  maxLength,
  inputMode,
}: Props) {
  const t = useTranslations();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (revealed ? "text" : "password") : type;

  const sharedClassName =
    "w-full rounded-lg border border-laku-line bg-white px-4 text-sm text-laku-ink outline-none transition-colors placeholder:text-laku-faint focus:border-laku-blue";

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-laku-ink">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className={`${sharedClassName} py-2.5`}
        />
      ) : (
        <span className="relative block">
          <input
            name={name}
            type={inputType}
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={inputMode}
            value={value}
            onChange={onChange ? (event) => onChange(event.target.value) : undefined}
            className={`h-11 ${sharedClassName} ${isPassword ? "pr-11" : ""}`}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-laku-muted transition-colors hover:text-laku-ink"
              aria-label={
                revealed
                  ? t("auth.hidePassword")
                  : t("auth.showPassword")
              }
            >
              {revealed ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          ) : null}
        </span>
      )}
      {hint ? <span className="mt-1 block text-xs text-laku-muted">{hint}</span> : null}
    </label>
  );
}
