"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Search } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import { resolveSearchQuery } from "@/lib/resolveSearchQuery";
import { pushRecentSearch, readRecentSearches } from "@/lib/searchDiscovery";

type Props = {
  /** Blue sits on the header band, plain sits on white page sections. */
  tone?: "onBlue" | "plain";
  autoFocus?: boolean;
};

export default function SearchBar({ tone = "onBlue", autoFocus = false }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return recent.slice(0, 6);
    return recent.filter((item) => item.includes(q)).slice(0, 6);
  }, [value, recent]);

  function goToSearch(raw: string) {
    const { displayQuery, category } = resolveSearchQuery(raw);
    if (!displayQuery) {
      router.push("/search");
      setFocused(false);
      return;
    }
    pushRecentSearch(displayQuery);
    setRecent(readRecentSearches());
    const params = new URLSearchParams();
    params.set("q", displayQuery);
    if (category) params.set("category", category);
    router.push(`/search?${params.toString()}`);
    setFocused(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToSearch(value);
  }

  return (
    <div className="relative w-full">
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
          onFocus={() => {
            setRecent(readRecentSearches());
            setFocused(true);
          }}
          onBlur={() => {
            // Delay so suggestion clicks register.
            window.setTimeout(() => setFocused(false), 150);
          }}
          placeholder={t("header.searchPlaceholder")}
          aria-label={t("header.searchLabel")}
          className="w-full bg-transparent text-sm text-laku-ink outline-none placeholder:text-laku-muted"
          autoComplete="off"
        />
      </form>

      {focused && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-laku-line bg-white shadow-lg">
          {suggestions.map((item) => (
            <li key={item}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue(item);
                  goToSearch(item);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-laku-ink transition-colors hover:bg-laku-blue/5"
              >
                <Search className="size-3.5 text-laku-muted" aria-hidden />
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
