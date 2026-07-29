"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/app/actions/cart";
import {
  followDistributor,
  unfollowDistributor,
} from "@/lib/api/following";
import { getSession } from "@/lib/auth/session";
import { getTranslations } from "@/i18n/server";

export async function toggleFollowDistributorAction(params: {
  distributorId: number;
  shouldFollow: boolean;
}): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const t = await getTranslations();
  const distributorId = params.distributorId;
  if (!Number.isFinite(distributorId) || distributorId < 1) {
    return { ok: false, error: t("distributor.follow.error") };
  }

  const result = params.shouldFollow
    ? await followDistributor({ distributorId, token: session.token })
    : await unfollowDistributor({ distributorId, token: session.token });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/distributor/${distributorId}`);
  revalidatePath(`/distributor/${distributorId}/details`);
  revalidatePath(`/seller/${distributorId}`);
  return { ok: true };
}
