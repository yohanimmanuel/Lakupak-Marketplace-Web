import { NextResponse } from "next/server";

import { getTranslations } from "@/i18n/server";
import { LAKU_API_BASE_URL } from "@/lib/config";
import { getSession } from "@/lib/auth/session";

const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Proof uploads are proxied: the browser cannot reach the Dashboard directly
 * and the marketplace token never leaves the server.
 */
export async function POST(request: Request) {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("payOrder.errors.signIn") }, { status: 401 });
  }

  const incoming = await request.formData().catch(() => null);
  const file = incoming?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: t("payOrder.errors.fileMissing") }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: t("payOrder.errors.fileTooLarge") }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf";
  if (!isPdf && !IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: t("payOrder.errors.fileType") }, { status: 400 });
  }

  const body = new FormData();
  body.append("file", file, file.name);

  let upstream: Response;
  if (isPdf) {
    upstream = await fetch(`${LAKU_API_BASE_URL}/api/mobile/upload/payment-receipt`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body,
      cache: "no-store",
    });
  } else {
    body.append("folder", "payment-proofs");
    upstream = await fetch(`${LAKU_API_BASE_URL}/api/upload/image`, {
      method: "POST",
      body,
      cache: "no-store",
    });
  }

  const payload = (await upstream.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!upstream.ok || !payload.url) {
    return NextResponse.json(
      { error: payload.error ?? t("payOrder.errors.upload") },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }

  return NextResponse.json({ url: payload.url, fileName: file.name });
}
