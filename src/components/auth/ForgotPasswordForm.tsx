"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";

import { useTranslations } from "@/i18n/client";

import AuthField from "./AuthField";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongPassword(pwd: string): boolean {
  return (
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /\d/.test(pwd) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
  );
}

type ApiError = {
  error?: string;
  code?: string;
};

type Step = 1 | 2 | 3;

export default function ForgotPasswordForm({
  initialEmail = "",
  initialCode = "",
  initialStep = 1,
}: {
  initialEmail?: string;
  initialCode?: string;
  initialStep?: Step;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function mapApiError(status: number, payload: ApiError): string {
    if (status === 429) {
      return t("auth.forgotPassword.alerts.rateLimitedBody");
    }
    const apiCode = payload.code;
    if (
      apiCode === "INVALID_OR_EXPIRED_CODE" ||
      apiCode === "EXPIRED_CODE" ||
      apiCode === "OTP_VERIFY_FAILED"
    ) {
      return t("auth.forgotPassword.alerts.invalidOrExpiredCodeBody");
    }
    if (apiCode === "SIGNUP_WEAK_PASSWORD") {
      return t("auth.forgotPassword.passwordHint");
    }
    return payload.error ?? t("auth.forgotPassword.alerts.genericErrorBody");
  }

  async function postJson(url: string, body: Record<string, string>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as ApiError & {
      message?: string;
      valid?: boolean;
    };
    return { response, payload };
  }

  async function handleStep1(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t("auth.forgotPassword.alerts.enterEmailBody"));
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError(t("auth.forgotPassword.alerts.invalidEmailBody"));
      return;
    }

    setSubmitting(true);
    try {
      const { response, payload } = await postJson("/api/auth/forgot-password", {
        email: trimmed,
      });
      if (!response.ok) {
        setError(mapApiError(response.status, payload));
        return;
      }
      setEmail(trimmed);
      setStep(2);
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep2(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError(t("auth.forgotPassword.alerts.codeRequiredBody"));
      return;
    }

    setSubmitting(true);
    try {
      const { response, payload } = await postJson(
        "/api/auth/verify-reset-code",
        { email: email.trim().toLowerCase(), token: trimmedCode },
      );
      if (!response.ok) {
        setError(mapApiError(response.status, payload));
        return;
      }
      setCode(trimmedCode);
      setStep(3);
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep3(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError(t("auth.forgotPassword.alerts.codeRequiredBody"));
      setStep(2);
      return;
    }
    if (!password.trim()) {
      setError(t("auth.forgotPassword.alerts.enterNewPasswordBody"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.forgotPassword.alerts.mismatchBody"));
      return;
    }
    if (!isStrongPassword(password)) {
      setError(t("auth.forgotPassword.passwordHint"));
      return;
    }

    setSubmitting(true);
    try {
      const { response, payload } = await postJson("/api/auth/reset-password", {
        email: email.trim().toLowerCase(),
        token: trimmedCode,
        password,
      });
      if (!response.ok) {
        const message = mapApiError(response.status, payload);
        setError(message);
        if (
          payload.code === "INVALID_OR_EXPIRED_CODE" ||
          payload.code === "EXPIRED_CODE" ||
          payload.code === "OTP_VERIFY_FAILED"
        ) {
          setStep(2);
          setPassword("");
          setConfirmPassword("");
        }
        return;
      }
      setSuccess(t("auth.forgotPassword.alerts.passwordResetBody"));
      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === 3) {
      setStep(2);
      setPassword("");
      setConfirmPassword("");
      return;
    }
    if (step === 2) {
      setStep(1);
      setCode("");
      return;
    }
    router.push("/login");
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold text-laku-ink">
          {t("auth.forgotPassword.alerts.passwordResetTitle")}
        </p>
        <p className="text-sm text-laku-muted">{success}</p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-laku-blue px-5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {step === 1
          ? t("auth.forgotPassword.backToLogin")
          : t("common.back")}
      </button>

      {step === 1 ? (
        <form onSubmit={handleStep1} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-laku-ink">
              {t("auth.forgotPassword.step1.heading")}
            </h2>
            <p className="mt-1 text-sm text-laku-muted">
              {t("auth.forgotPassword.step1.subheading")}
            </p>
          </div>
          <AuthField
            label={t("auth.forgotPassword.step1.emailLabel")}
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.forgotPassword.step1.emailPlaceholder")}
            value={email}
            onChange={setEmail}
            inputMode="email"
          />
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
            {submitting
              ? t("auth.forgotPassword.step1.sending")
              : t("auth.forgotPassword.step1.continue")}
          </button>
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={handleStep2} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-laku-ink">
              {t("auth.forgotPassword.step2.heading")}
            </h2>
            <p className="mt-1 text-sm text-laku-muted">
              {t("auth.forgotPassword.step2.subheading")}
            </p>
          </div>
          <AuthField
            label={t("auth.forgotPassword.step2.codeLabel")}
            name="code"
            autoComplete="one-time-code"
            placeholder={t("auth.forgotPassword.step2.codePlaceholder")}
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            inputMode="numeric"
          />
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
            {submitting
              ? t("auth.forgotPassword.step2.verifying")
              : t("auth.forgotPassword.step2.continue")}
          </button>
        </form>
      ) : null}

      {step === 3 ? (
        <form onSubmit={handleStep3} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-laku-ink">
              {t("auth.forgotPassword.step3.heading")}
            </h2>
            <p className="mt-1 text-sm text-laku-muted">
              {t("auth.forgotPassword.step3.subheading")}
            </p>
          </div>
          <AuthField
            label={t("auth.forgotPassword.step3.newPasswordLabel")}
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.forgotPassword.step3.newPasswordPlaceholder")}
            hint={t("auth.forgotPassword.passwordHint")}
            value={password}
            onChange={setPassword}
          />
          <AuthField
            label={t("auth.forgotPassword.step3.confirmPasswordLabel")}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t(
              "auth.forgotPassword.step3.confirmPasswordPlaceholder",
            )}
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
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
            {submitting
              ? t("auth.forgotPassword.step3.resetting")
              : t("auth.forgotPassword.step3.resetPassword")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
