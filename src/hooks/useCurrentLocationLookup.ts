"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "@/i18n/client";
import {
  locateCurrentAddress,
  type GeocodePrecision,
  type MapCoordinates,
} from "@/lib/geolocation";

type Options = {
  /** Push resolved (or cleared) address text into the parent form field. */
  onAddressChange: (address: string) => void;
  /** Existing address when editing a saved record. */
  initialAddress?: string;
  initialCoordinates?: MapCoordinates | null;
  initialPrecision?: GeocodePrecision | null;
  /** e.g. clear a shared form error when locate starts. */
  onLocateStart?: () => void;
};

/**
 * Shared GPS → reverse-geocode flow for RegisterForm and AddressForm.
 * Includes the not_found address-clearing fix so the map pin can stay on GPS
 * without a stale typed address.
 */
export function useCurrentLocationLookup({
  onAddressChange,
  initialAddress = "",
  initialCoordinates = null,
  initialPrecision = null,
  onLocateStart,
}: Options) {
  const t = useTranslations();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [savedAddressSnapshot, setSavedAddressSnapshot] = useState(
    initialAddress.trim(),
  );
  const [savedCoordinates, setSavedCoordinates] =
    useState<MapCoordinates | null>(initialCoordinates);
  const [savedPrecision, setSavedPrecision] = useState<GeocodePrecision | null>(
    initialPrecision,
  );

  const mapPinFor = useCallback(
    (address: string) => {
      const match = address.trim() === savedAddressSnapshot;
      return {
        savedCoordinates: match && savedCoordinates ? savedCoordinates : null,
        savedPrecision: match ? savedPrecision : null,
      };
    },
    [savedAddressSnapshot, savedCoordinates, savedPrecision],
  );

  const onUseCurrentLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    setLocationError(null);
    onLocateStart?.();
    try {
      const outcome = await locateCurrentAddress();
      if (outcome.ok) {
        const { address, coordinates, precision } = outcome.result;
        onAddressChange(address);
        setSavedAddressSnapshot(address);
        setSavedCoordinates(coordinates);
        setSavedPrecision(precision);
        return;
      }

      if (outcome.coordinates) {
        setSavedCoordinates(outcome.coordinates);
        setSavedPrecision("exact");
        // Clear stale address text so the preview does not re-forward-geocode.
        if (outcome.error === "not_found") {
          onAddressChange("");
          setSavedAddressSnapshot("");
        }
      }

      if (outcome.error === "permission") {
        setLocationError(t("location.permissionBody"));
      } else if (outcome.error === "not_found") {
        setLocationError(t("location.notFound"));
      } else {
        setLocationError(t("location.errorBody"));
      }
    } finally {
      setLocating(false);
    }
  }, [locating, onAddressChange, onLocateStart, t]);

  return {
    locating,
    locationError,
    setLocationError,
    mapPinFor,
    onUseCurrentLocation,
  };
}
