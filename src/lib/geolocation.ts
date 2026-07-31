export type MapCoordinates = { latitude: number; longitude: number };
export type GeocodePrecision = "exact" | "approximate" | "area";

export type CurrentLocationResult = {
  address: string;
  coordinates: MapCoordinates;
  precision: GeocodePrecision;
};

export type CurrentLocationError =
  | "permission"
  | "unavailable"
  | "not_found"
  | "unsupported";

type LocateOutcome =
  | { ok: true; result: CurrentLocationResult }
  | { ok: false; error: CurrentLocationError; coordinates?: MapCoordinates };

function readPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20_000,
      maximumAge: 0,
    });
  });
}

/**
 * Browser GPS + Dashboard reverse-geocode — same flow as mobile
 * `onUseCurrentLocation` (expo-location → /api/mobile/geocode/reverse).
 */
export async function locateCurrentAddress(): Promise<LocateOutcome> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, error: "unsupported" };
  }

  let latitude: number;
  let longitude: number;

  try {
    const position = await readPosition();
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? Number((error as GeolocationPositionError).code)
        : NaN;
    if (code === 1) return { ok: false, error: "permission" };
    return { ok: false, error: "unavailable" };
  }

  const coordinates = { latitude, longitude };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch("/api/geocode/reverse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coordinates),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return { ok: false, error: "unavailable", coordinates };
    }

    const payload = (await response.json()) as {
      address?: string;
      coordinates?: MapCoordinates | null;
      precision?: GeocodePrecision | null;
    };

    const address = payload.address?.trim() ?? "";
    const pin = payload.coordinates ?? coordinates;

    if (!address) {
      return { ok: false, error: "not_found", coordinates: pin };
    }

    return {
      ok: true,
      result: {
        address,
        coordinates: pin,
        precision: payload.precision ?? "exact",
      },
    };
  } catch {
    return { ok: false, error: "unavailable", coordinates };
  }
}
