import { NextResponse } from "next/server";

import { getTranslations } from "@/i18n/server";
import { LAKU_API_BASE_URL } from "@/lib/config";

export async function POST(request: Request) {
  const t = await getTranslations();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t("auth.invalidRequest") }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const token = typeof record.token === "string" ? record.token.trim() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !token) {
    return NextResponse.json(
      { error: t("auth.forgotPassword.alerts.codeRequiredBody") },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json(
      { error: t("auth.forgotPassword.alerts.enterNewPasswordBody") },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `${LAKU_API_BASE_URL}/api/mobile/auth/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
      cache: "no-store",
    },
  );

  const payload = (await upstream.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    code?: string;
  };

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: payload.error ?? t("auth.forgotPassword.alerts.genericErrorBody"),
        code: payload.code,
      },
      { status: upstream.status },
    );
  }

  return NextResponse.json({
    message:
      payload.message ?? t("auth.forgotPassword.alerts.passwordResetBody"),
  });
}
