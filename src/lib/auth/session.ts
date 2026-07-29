import "server-only";

import { cookies } from "next/headers";

import type { SessionUser } from "@/lib/api/types";
import { SESSION_COOKIE, SESSION_USER_COOKIE } from "@/lib/config";

export type Session = {
  token: string;
  user: SessionUser;
};

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const rawUser = store.get(SESSION_USER_COOKIE)?.value;

  if (!token || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as SessionUser;
    if (!user?.id) return null;
    return { token, user };
  } catch {
    return null;
  }
}
