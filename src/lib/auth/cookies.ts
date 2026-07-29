import type { NextResponse } from "next/server";

import type { SessionUser } from "@/lib/api/types";
import { SESSION_COOKIE, SESSION_USER_COOKIE } from "@/lib/config";

/** Marketplace JWTs are issued with a 30 day lifetime by the Dashboard. */
const MAX_AGE = 60 * 60 * 24 * 30;

export function applySessionCookies(
  response: NextResponse,
  token: string,
  user: SessionUser,
) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  response.cookies.set(
    SESSION_USER_COOKIE,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
    }),
    {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    },
  );
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(SESSION_USER_COOKIE);
}
