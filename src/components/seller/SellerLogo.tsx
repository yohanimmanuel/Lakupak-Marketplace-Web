"use client";

import { useState } from "react";
import Image from "next/image";
import { Store } from "lucide-react";

type SellerLogoProps = { src?: string | null };

export default function SellerLogo({ src }: SellerLogoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const validSrc = src?.trim();
  const isPlaceholder = validSrc?.split("?")[0].endsWith("/default-avatar.png");

  if (!validSrc || isPlaceholder || failedSrc === validSrc) {
    return <Store className="size-5" aria-hidden />;
  }

  return (
    <Image
      src={validSrc}
      alt=""
      fill
      sizes="44px"
      className="object-cover"
      onError={() => setFailedSrc(validSrc)}
    />
  );
}
