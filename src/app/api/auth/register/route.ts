import { NextResponse } from "next/server";

import { getTranslations } from "@/i18n/server";
import { applySessionCookies } from "@/lib/auth/cookies";
import { LAKU_API_BASE_URL } from "@/lib/config";

type RegisterBody = {
  name?: string;
  storeName?: string;
  bio?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  address?: string;
  addressFullName?: string;
  addressLabel?: "work" | "store" | "home";
  addressIsDefault?: boolean;
  countryCode?: string;
  countryDialCode?: string;
};

export async function POST(request: Request) {
  const t = await getTranslations();
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: t("auth.invalidRequest") }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const addressFullName = body.addressFullName?.trim() || name;

  const upstream = await fetch(`${LAKU_API_BASE_URL}/api/mobile/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      storeName: body.storeName?.trim() || name,
      bio: body.bio?.trim() || undefined,
      username: body.username?.trim(),
      email: body.email?.trim()?.toLowerCase(),
      phone: body.phone?.trim(),
      countryDialCode: body.countryDialCode?.trim() || "+62",
      countryCode: body.countryCode?.trim() || "ID",
      password: body.password,
      address: body.address?.trim(),
      addressFullName,
      addressLabel: body.addressLabel || "home",
      addressIsDefault: body.addressIsDefault ?? true,
    }),
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => ({}))) as {
    token?: string;
    user?: { id: number; name: string; email: string; address?: string };
    error?: string;
  };

  if (!upstream.ok || !payload.token || !payload.user) {
    return NextResponse.json(
      { error: payload.error ?? t("auth.registerError") },
      { status: upstream.ok ? 400 : upstream.status },
    );
  }

  const response = NextResponse.json({ user: payload.user });
  applySessionCookies(response, payload.token, payload.user);
  return response;
}
