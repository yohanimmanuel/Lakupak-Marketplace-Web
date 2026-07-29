"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function ReviewImageStrip({
  urls,
  openLabel,
  closeLabel,
}: {
  urls: string[];
  openLabel: string;
  closeLabel: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const images = urls.filter(Boolean).slice(0, 5);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="relative size-[72px] shrink-0 overflow-hidden rounded-lg bg-laku-chip"
            aria-label={openLabel}
          >
            <Image
              src={url}
              alt=""
              fill
              sizes="72px"
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>

      {activeIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-laku-ink"
            aria-label={closeLabel}
          >
            <X className="size-5" aria-hidden />
          </button>
          <div
            className="relative h-[min(80vh,720px)] w-[min(92vw,720px)]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={images[activeIndex]!}
              alt=""
              fill
              sizes="720px"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
