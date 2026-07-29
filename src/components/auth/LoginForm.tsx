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

      {/* Google / social login — temporarily disabled (parity with mobile app).
      <div className="relative my-2 text-center text-xs font-semibold uppercase tracking-wide text-laku-muted">
        <span className="bg-white px-2">or</span>
      </div>
      <button
        type="button"
        disabled
        className="h-11 w-full rounded-lg border border-laku-line bg-white text-sm font-semibold text-laku-ink opacity-60"
      >
        Continue with Google
      </button>
      */}
    </form>
  );
}
