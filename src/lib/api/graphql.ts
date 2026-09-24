import "server-only";

import { LAKU_API_BASE_URL } from "@/lib/config";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export class LakuApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LakuApiError";
  }
}

/**
 * The Dashboard sends no CORS headers, so every catalog call is made from the
 * Next.js server (RSC or route handler), never from the browser.
 */
export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: { token?: string; revalidate?: number } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${LAKU_API_BASE_URL}/api/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: options.token ? undefined : { revalidate: options.revalidate ?? 60 },
    cache: options.token ? "no-store" : undefined,
  });

  if (!response.ok) {
    throw new LakuApiError(`Lakupak API responded with ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new LakuApiError(payload.errors[0].message);
  }
  if (!payload.data) {
    throw new LakuApiError("Lakupak API returned an empty response");
  }

  return payload.data;
}

/** Same transport as graphqlRequest, but surfaces errors instead of throwing. */
export async function graphqlMutate<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<MutationResult<T>> {
  try {
    const data = await graphqlRequest<T>(query, variables, { token });
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof LakuApiError ? error.message : "Permintaan gagal diproses.";
    return { ok: false, status: 400, error: message };
  }
}

export async function restRequest<T>(
  path: string,
  options: { token?: string; revalidate?: number } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${LAKU_API_BASE_URL}${path}`, {
    headers,
    next: options.token ? undefined : { revalidate: options.revalidate ?? 60 },
    cache: options.token ? "no-store" : undefined,
  });

  if (!response.ok) {
    throw new LakuApiError(`Lakupak API responded with ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

/** Writes surface the upstream message so forms can show why something failed. */
export async function restMutate<T>(
  path: string,
  options: {
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    token: string;
    body?: unknown;
  },
): Promise<MutationResult<T>> {
  try {
    const response = await fetch(`${LAKU_API_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.token}`,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as T & {
      error?: string;
      message?: string;
      details?: string;
    };

    if (!response.ok) {
      const errorText =
        typeof payload?.error === "string" ? payload.error.trim() : "";
      const messageText =
        typeof payload?.message === "string" ? payload.message.trim() : "";
      const primary = errorText || messageText || "Permintaan gagal diproses.";
      const details =
        typeof payload?.details === "string" && payload.details.trim()
          ? payload.details.trim()
          : "";
      return {
        ok: false,
        status: response.status,
        error: details && details !== primary ? `${primary}: ${details}` : primary,
      };
    }

    return { ok: true, data: payload };
  } catch {
    return { ok: false, status: 0, error: "Tidak dapat terhubung ke server Lakupak." };
  }
}
