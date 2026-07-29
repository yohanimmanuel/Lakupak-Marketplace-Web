import { NextResponse } from "next/server";

import { getTranslations } from "@/i18n/server";
import { LAKU_API_BASE_URL } from "@/lib/config";

async function proxyAuth(
  path: string,
  body: unknown,
  fallbackError: string,
): Promise<NextResponse> {
  const upstream = await fetch(`${LAKU_API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error:
          typeof payload.error === "string" ? payload.error : fallbackError,
        code: typeof payload.code === "string" ? payload.code : undefined,
      },
      { status: upstream.status },
    );
  }

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const t = await getTranslations();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t("auth.invalidRequest") }, { status: 400 });
  }

  const email =
    body &&
    typeof body === "object" &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email) {
    return NextResponse.json(
      { error: t("auth.forgotPassword.alerts.enterEmailBody") },
      { status: 400 },
    );
  }

  return proxyAuth(
    "/api/mobile/auth/forgot-password",
    { email },
    t("auth.forgotPassword.alerts.genericErrorBody"),
  );
}
