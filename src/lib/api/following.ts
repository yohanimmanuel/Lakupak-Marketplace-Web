import "server-only";

import { restMutate, restRequest } from "@/lib/api/graphql";

export type FollowedDistributor = {
  distributorId: number;
  name: string;
  logo: string | null;
  bannerImage: string | null;
  followedAt: string;
};

export async function listFollowedDistributors(params: {
  token: string;
}): Promise<FollowedDistributor[]> {
  try {
    const data = await restRequest<{ items?: FollowedDistributor[] }>(
      "/api/mobile/following/distributors",
      { token: params.token },
    );
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function isFollowingDistributor(params: {
  distributorId: number;
  token: string;
}): Promise<boolean> {
  try {
    const data = await restRequest<{ isFollowing?: boolean }>(
      `/api/mobile/following/distributors/${params.distributorId}`,
      { token: params.token },
    );
    return Boolean(data.isFollowing);
  } catch {
    return false;
  }
}

export async function followDistributor(params: {
  distributorId: number;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await restMutate<{ ok?: boolean }>(
    "/api/mobile/following/distributors",
    {
      method: "POST",
      token: params.token,
      body: { distributorId: params.distributorId },
    },
  );
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function unfollowDistributor(params: {
  distributorId: number;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await restMutate<{ ok?: boolean }>(
    `/api/mobile/following/distributors/${params.distributorId}`,
    {
      method: "DELETE",
      token: params.token,
    },
  );
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
