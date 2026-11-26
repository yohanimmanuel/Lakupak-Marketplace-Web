"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useTranslations } from "@/i18n/client";
import { LAKU_API_BASE_URL } from "@/lib/config";

import AuthField from "./AuthField";

export default function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = (searchParams.get("invite") || "").trim();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteBanner, setInviteBanner] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [inviteLocksReferral, setInviteLocksReferral] = useState(false);

  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `${LAKU_API_BASE_URL}/api/mobile/auth/invite/preview?token=${encodeURIComponent(inviteToken)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => ({}))) as {
          distributorName?: string;
          clientStoreName?: string;
          referralCode?: string | null;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok) {
          setError(payload.error ?? t("auth.invite.invalid"));
          return;
        }
        setInviteBanner(
          t("auth.invite.banner", {
            distributor: payload.distributorName || "Distributor",
            store: payload.clientStoreName || "your store",
          }),
        );
        setInviteLocksReferral(true);
        if (payload.referralCode) {
          setReferralCode(String(payload.referralCode).toUpperCase());
        }
      } catch {
        if (!cancelled) setError(t("auth.networkError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteToken, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
          referralCode:
            referralCode.trim() ||
            String(formData.get("referralCode") ?? "").trim() ||
            undefined,
          inviteToken: inviteToken || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? t("auth.loginError"));
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inviteBanner ? (
        <div className="rounded-xl border border-laku-blue/20 bg-laku-blue/5 px-3 py-2 text-sm text-laku-ink">
          {inviteBanner}
        </div>
      ) : null}

      <AuthField
        label={t("auth.usernameOrEmail")}
        name="username"
        autoComplete="username"
        placeholder={t("auth.usernamePlaceholder")}
      />
      <AuthField
        label={t("auth.password")}
        name="password"
        type="password"
        autoComplete="current-password"
      />
      <AuthField
        label={t("auth.referralCode.label")}
        name="referralCode"
        autoComplete="off"
        maxLength={24}
        placeholder={t("auth.referralCode.placeholder")}
        hint={
          inviteLocksReferral
            ? t("auth.invite.lockedReferralHint")
            : t("auth.referralCode.loginHint")
        }
        value={referralCode}
        onChange={(value) => setReferralCode(value.toUpperCase())}
        disabled={inviteLocksReferral}
      />

      <div className="-mt-2 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-laku-blue hover:underline"
        >
          {t("auth.forgotPassword.link")}
        </Link>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-laku-alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-lg bg-laku-blue text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60"
      >
        {submitting ? t("auth.submitting") : t("auth.submitLogin")}
      </button>

      <p className="pt-2 text-center text-sm text-laku-muted">
        {t("auth.noAccount")}{" "}
        <Link
          href={inviteToken ? `/register?invite=${encodeURIComponent(inviteToken)}` : "/register"}
          className="font-semibold text-laku-blue hover:underline"
        >
          {t("nav.registerFree")}
        </Link>
      </p>
    </form>
  );
}
