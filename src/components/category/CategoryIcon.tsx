"use client";

import Image from "next/image";
import {
  Apple,
  Baby,
  BookOpen,
  Boxes,
  Briefcase,
  Camera,
  Car,
  Cpu,
  Dumbbell,
  Footprints,
  Gamepad2,
  Gem,
  Heart,
  HeartHandshake,
  Home,
  LayoutGrid,
  Monitor,
  Music,
  PawPrint,
  Pill,
  Plane,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  SprayCan,
  UtensilsCrossed,
  Watch,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { getCategoryImageSrc } from "@/lib/categories";

const ICONS: Record<string, LucideIcon> = {
  Apple,
  Baby,
  BookOpen,
  Boxes,
  Briefcase,
  Camera,
  Car,
  Cpu,
  Dumbbell,
  Footprints,
  Gamepad2,
  Gem,
  Heart,
  HeartHandshake,
  Home,
  LayoutGrid,
  Monitor,
  Music,
  PawPrint,
  Pill,
  Plane,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  SprayCan,
  UtensilsCrossed,
  Watch,
  Wrench,
};

export default function CategoryIcon({
  name,
  categoryName,
  className,
}: {
  /** Lucide icon key from BrowseCategory.icon */
  name: string;
  /** Canonical category English key — used to resolve pictorial assets */
  categoryName?: string;
  className?: string;
}) {
  const imageSrc = getCategoryImageSrc(categoryName);
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt=""
        width={56}
        height={56}
        className={className ?? "size-10 object-contain"}
        aria-hidden
      />
    );
  }

  const Icon = ICONS[name] ?? LayoutGrid;
  return <Icon className={className} aria-hidden />;
}
