"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useTranslations } from "@/i18n/client";

import AuthField from "./AuthField";

export default function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          referralCode: String(formData.get("referralCode") ?? "").trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        membershipAccess?: "active" | "pending";
      };

      if (!response.ok) {
        setError(payload.error ?? t("auth.loginError"));
        return;
      }

      if (payload.membershipAccess === "pending") {
        router.replace("/access-pending");
        router.refresh();
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
        hint={t("auth.referralCode.loginHint")}
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
        <Link href="/register" className="font-semibold text-laku-blue hover:underline">
          {t("nav.registerFree")}
        </Link>
      </p>
    </form>
  );
}
