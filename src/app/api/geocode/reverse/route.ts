import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { LAKU_API_BASE_URL } from "@/lib/config";

type ReverseBody = { latitude?: unknown; longitude?: unknown };

/**
 * Proxies reverse geocoding through the Dashboard — same path as the mobile
 * "Use current location" button. Auth is optional (signup is signed-out).
 */
export async function POST(request: Request) {
  let body: ReverseBody;
  try {
    body = (await request.json()) as ReverseBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const latitude = typeof body.latitude === "number" ? body.latitude : NaN;
  const longitude = typeof body.longitude === "number" ? body.longitude : NaN;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "valid latitude and longitude are required" },
      { status: 400 },
    );
  }

  const session = await getSession();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);
    const upstream = await fetch(
      `${LAKU_API_BASE_URL}/api/mobile/geocode/reverse`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ latitude, longitude }),
        cache: "no-store",
        signal: controller.signal,
      },
    ).finally(() => clearTimeout(timeoutId));

    const payload = (await upstream.json().catch(() => ({}))) as {
      coordinates?: { latitude: number; longitude: number } | null;
      address?: string;
      precision?: "exact" | "approximate" | "area" | null;
      error?: string;
    };

    if (!upstream.ok) {
      return NextResponse.json(
        { error: payload.error ?? "Reverse geocoding failed" },
        { status: upstream.status },
      );
    }

    return NextResponse.json({
      coordinates: payload.coordinates ?? { latitude, longitude },
      address: payload.address ?? "",
      precision: payload.precision ?? "exact",
    });
  } catch {
    return NextResponse.json(
      { error: "Reverse geocoding unavailable" },
      { status: 502 },
    );
  }
}
