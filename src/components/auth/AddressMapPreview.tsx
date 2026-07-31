"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import type { GeocodePrecision, MapCoordinates } from "@/lib/geolocation";
import MapboxAddressMap from "./MapboxAddressMap";

type GeocodeResponse = {
  coordinates: MapCoordinates | null;
  address?: string;
  precision?: GeocodePrecision | null;
};

type Props = {
  address: string;
  /** Prefer GPS / saved pin when the address text still matches (avoids re-geocode drift). */
  savedCoordinates?: MapCoordinates | null;
  savedPrecision?: GeocodePrecision | null;
  height?: number;
};

/** Debounced map preview matching AddressMapPreview in the mobile app. */
export default function AddressMapPreview({
  address,
  savedCoordinates = null,
  savedPrecision = null,
  height = 240,
}: Props) {
  const t = useTranslations();
  const trimmed = address.trim();
  const requestIdRef = useRef(0);
  const [geocodedCoordinates, setGeocodedCoordinates] =
    useState<MapCoordinates | null>(null);
  const [geocodedPrecision, setGeocodedPrecision] =
    useState<GeocodePrecision | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usingSaved =
    Boolean(trimmed) &&
    savedCoordinates != null &&
    Number.isFinite(savedCoordinates.latitude) &&
    Number.isFinite(savedCoordinates.longitude);

  useEffect(() => {
    if (!trimmed || usingSaved) return;

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      setLoading(true);

      void fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      })
        .then(async (response) => {
          if (requestId !== requestIdRef.current) return;
          if (!response.ok) {
            setGeocodedCoordinates(null);
            setGeocodedPrecision(null);
            setResolvedQuery(trimmed);
            setLoading(false);
            return;
          }

          const payload = (await response.json()) as GeocodeResponse;
          if (requestId !== requestIdRef.current) return;

          setGeocodedCoordinates(payload.coordinates ?? null);
          setGeocodedPrecision(payload.precision ?? null);
          setResolvedQuery(trimmed);
          setLoading(false);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setGeocodedCoordinates(null);
          setGeocodedPrecision(null);
          setResolvedQuery(trimmed);
          setLoading(false);
        });
    }, 700);

    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [trimmed, usingSaved]);

  const hasAddress = Boolean(trimmed);
  const isResolved = usingSaved || resolvedQuery === trimmed;
  const pin = !hasAddress
    ? null
    : usingSaved
      ? savedCoordinates
      : isResolved
        ? geocodedCoordinates
        : null;
  const pinPrecision = !hasAddress
    ? null
    : usingSaved
      ? (savedPrecision ?? "exact")
      : isResolved
        ? geocodedPrecision
        : null;
  const showLoading = hasAddress && !usingSaved && (loading || !isResolved);
  const showNotFound = hasAddress && isResolved && !loading && !pin;
  const approximate =
    pinPrecision === "approximate" || pinPrecision === "area";

  return (
    <div className="overflow-hidden rounded-2xl border border-laku-line bg-white">
      <div className="relative w-full bg-[#dbe7f3]" style={{ height }}>
        <MapboxAddressMap
          coordinates={pin}
          className="absolute inset-0 h-full w-full"
        />

        {showLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/55 backdrop-blur-[1px]">
            <span className="size-8 animate-pulse rounded-full bg-laku-blue/20" />
            <p className="text-sm font-medium text-laku-muted">
              {t("auth.signup.mapLoading")}
            </p>
          </div>
        ) : null}

        {!showLoading && !hasAddress ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0b1220]/40 px-6 text-center">
            <MapPin className="size-7 text-white" aria-hidden />
            <p className="text-sm font-semibold text-white">
              {t("auth.signup.mapEnterAddress")}
            </p>
            <p className="text-xs text-white/85">{t("auth.signup.mapHint")}</p>
          </div>
        ) : null}

        {showNotFound ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0b1220]/40 px-6 text-center">
            <MapPin className="size-7 text-white" aria-hidden />
            <p className="text-sm font-semibold text-white">
              {t("auth.signup.mapNotFound")}
            </p>
          </div>
        ) : null}
      </div>

      {hasAddress ? (
        <div className="flex items-start gap-2.5 border-t border-laku-line px-4 py-3.5">
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-laku-blue" />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium text-laku-ink">{trimmed}</p>
            {approximate && pin ? (
              <p className="mt-1 text-xs text-laku-muted">
                {t("auth.signup.mapApproximate")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
