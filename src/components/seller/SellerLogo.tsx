"use client";

import { useState } from "react";
import Image from "next/image";
import { Store } from "lucide-react";

type SellerLogoProps = { src?: string | null; iconClassName?: string; sizes?: string };

export default function SellerLogo({ src, iconClassName = "size-5", sizes = "44px" }: SellerLogoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const validSrc = src?.trim();
  const isPlaceholder = validSrc?.split("?")[0].endsWith("/default-avatar.png");

  if (!validSrc || isPlaceholder || failedSrc === validSrc) {
    return <Store className={iconClassName} aria-hidden />;
  }

  return (
    <Image
      src={validSrc}
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailedSrc(validSrc)}
    />
  );
}
