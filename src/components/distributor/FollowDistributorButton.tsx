"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";

import { toggleFollowDistributorAction } from "@/app/actions/following";
import { useTranslations } from "@/i18n/client";

export default function FollowDistributorButton({
  distributorId,
  initiallyFollowing,
  signedIn,
}: {
  distributorId: number;
  initiallyFollowing: boolean;
  signedIn: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const following = optimistic ?? initiallyFollowing;
  const loginHref = `/login?next=${encodeURIComponent(`/distributor/${distributorId}`)}`;

  if (!signedIn) {
    return (
      <Link
        href={loginHref}
        className="inline-flex items-center gap-1.5 rounded-lg bg-laku-blue px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
      >
        <UserPlus className="size-4" aria-hidden />
        {t("distributor.follow.follow")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={
        following
          ? t("distributor.follow.unfollowA11y")
          : t("distributor.follow.followA11y")
      }
      onClick={() => {
        const next = !following;
        setOptimistic(next);
        startTransition(async () => {
          const result = await toggleFollowDistributorAction({
            distributorId,
            shouldFollow: next,
          });
          if (!result.ok) {
            setOptimistic(null);
            if (result.error === "unauthenticated") {
              router.push(loginHref);
            }
            return;
          }
          setOptimistic(null);
          router.refresh();
        });
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
        following
          ? "border border-laku-line bg-white text-laku-ink hover:bg-laku-surface"
          : "bg-laku-blue text-white hover:bg-laku-blue-dark"
      }`}
    >
      {following ? (
        <UserCheck className="size-4" aria-hidden />
      ) : (
        <UserPlus className="size-4" aria-hidden />
      )}
      {following
        ? t("distributor.follow.following")
        : t("distributor.follow.follow")}
    </button>
  );
}
