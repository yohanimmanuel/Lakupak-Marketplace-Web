import { NextResponse } from "next/server";

import { getTranslations } from "@/i18n/server";
import { LAKU_API_BASE_URL } from "@/lib/config";
import { applySessionCookies } from "@/lib/auth/cookies";
import { referralErrorMessage } from "@/lib/auth/referral";

export async function POST(request: Request) {
  const t = await getTranslations();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t("auth.invalidRequest") }, { status: 400 });
  }

  const upstream = await fetch(`${LAKU_API_BASE_URL}/api/mobile/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => ({}))) as {
    token?: string;
    user?: { id: number; name: string; email: string; address?: string };
    error?: string;
    code?: string;
  };

  if (!upstream.ok || !payload.token || !payload.user) {
    return NextResponse.json(
      {
        error: referralErrorMessage(t, payload.code) ?? payload.error ?? t("auth.loginError"),
        code: payload.code,
      },
      { status: upstream.status === 200 ? 401 : upstream.status },
    );
  }

  const response = NextResponse.json({ user: payload.user });
  applySessionCookies(response, payload.token, payload.user);
  return response;
}
