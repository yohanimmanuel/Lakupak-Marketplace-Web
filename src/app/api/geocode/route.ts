import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { LAKU_API_BASE_URL } from "@/lib/config";

type GeocodeBody = { address?: string };

/**
 * Proxies Google geocoding through the Dashboard the same way the app does.
 * Signup is signed-out, so auth is optional; the Dashboard rate-limits by IP.
 */
export async function POST(request: Request) {
  let body: GeocodeBody;
  try {
    body = (await request.json()) as GeocodeBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const session = await getSession();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  try {
    const upstream = await fetch(`${LAKU_API_BASE_URL}/api/mobile/geocode`, {
      method: "POST",
      headers,
      body: JSON.stringify({ address }),
      cache: "no-store",
    });

    const payload = (await upstream.json().catch(() => ({}))) as {
      coordinates?: { latitude: number; longitude: number } | null;
      address?: string;
      precision?: "exact" | "approximate" | "area" | null;
      error?: string;
    };

    if (!upstream.ok) {
      return NextResponse.json(
        { error: payload.error ?? "Geocoding failed" },
        { status: upstream.status },
      );
    }

    return NextResponse.json({
      coordinates: payload.coordinates ?? null,
      address: payload.address ?? address,
      precision: payload.precision ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Geocoding unavailable" }, { status: 502 });
  }
}
