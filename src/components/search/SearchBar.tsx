"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import { resolveSearchQuery } from "@/lib/resolveSearchQuery";

type Props = {
  /** Blue sits on the header band, plain sits on white page sections. */
  tone?: "onBlue" | "plain";
  autoFocus?: boolean;
};

export default function SearchBar({ tone = "onBlue", autoFocus = false }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { displayQuery, category } = resolveSearchQuery(value);
    if (!displayQuery) {
      router.push("/search");
      return;
    }

    const params = new URLSearchParams();
    params.set("q", displayQuery);
    if (category) params.set("category", category);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`flex h-10 w-full items-center gap-2 rounded-pill border bg-white px-4 ${
        tone === "onBlue" ? "border-laku-line" : "border-laku-line shadow-none"
      }`}
    >
      <Search className="size-4 shrink-0 text-laku-muted" aria-hidden />
      <input
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("header.searchPlaceholder")}
        aria-label={t("header.searchLabel")}
        className="w-full bg-transparent text-sm text-laku-ink outline-none placeholder:text-laku-muted"
      />
    </form>
  );
}
