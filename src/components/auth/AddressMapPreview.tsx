"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import MapboxAddressMap from "./MapboxAddressMap";

type Coordinates = { latitude: number; longitude: number };
type Precision = "exact" | "approximate" | "area";

type GeocodeResponse = {
  coordinates: Coordinates | null;
  address?: string;
  precision?: Precision | null;
};

type Props = {
  address: string;
  height?: number;
};

/** Debounced map preview matching AddressMapPreview in the mobile signup. */
export default function AddressMapPreview({ address, height = 240 }: Props) {
  const t = useTranslations();
  const trimmed = address.trim();
  const requestIdRef = useRef(0);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [precision, setPrecision] = useState<Precision | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trimmed) return;

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
            setCoordinates(null);
            setPrecision(null);
            setResolvedQuery(trimmed);
            setLoading(false);
            return;
          }

          const payload = (await response.json()) as GeocodeResponse;
          if (requestId !== requestIdRef.current) return;

          setCoordinates(payload.coordinates ?? null);
          setPrecision(payload.precision ?? null);
          setResolvedQuery(trimmed);
          setLoading(false);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setCoordinates(null);
          setPrecision(null);
          setResolvedQuery(trimmed);
          setLoading(false);
        });
    }, 700);

    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [trimmed]);

  const hasAddress = Boolean(trimmed);
  const isResolved = resolvedQuery === trimmed;
  const pin = hasAddress ? coordinates : null;
  const pinPrecision = hasAddress && isResolved ? precision : null;
  const showLoading = hasAddress && (loading || !isResolved);
  const showNotFound = hasAddress && isResolved && !loading && !coordinates;
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
