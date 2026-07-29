"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { useTranslations } from "@/i18n/client";

type Props = {
  images: string[];
  name: string;
};

export default function ProductGallery({ images, name }: Props) {
  const t = useTranslations();
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        role="img"
        aria-label={t("product.noImage")}
        className="flex aspect-square items-center justify-center rounded-2xl bg-laku-chip"
      >
        <ImageIcon className="size-12 text-laku-faint" aria-hidden />
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-laku-surface">
        <Image
          key={active}
          src={active}
          alt={name}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="laku-rise object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="laku-rail flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={t("product.viewImage", { index: index + 1 })}
              aria-current={index === activeIndex}
              className={`relative size-16 shrink-0 overflow-hidden rounded-card border-2 transition-colors ${
                index === activeIndex ? "border-laku-blue" : "border-transparent"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
