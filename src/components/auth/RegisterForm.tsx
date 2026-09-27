"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

import LakuLogo from "@/components/brand/LakuLogo";
import { useCurrentLocationLookup } from "@/hooks/useCurrentLocationLookup";
import { useTranslations } from "@/i18n/client";

import AuthField from "./AuthField";
import AddressMapPreview from "./AddressMapPreview";
import UseCurrentLocationButton from "./UseCurrentLocationButton";

type AddressLabel = "work" | "store" | "home";

type SignupData = {
  name: string;
  phone: string;
  email: string;
  storeName: string;
  bio: string;
  address: string;
  deliveryFullName: string;
  deliveryPhone: string;
  addressIsDefault: boolean;
  addressLabel: AddressLabel;
  username: string;
  password: string;
  confirmPassword: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_LABELS: AddressLabel[] = ["work", "store", "home"];
const INITIAL: SignupData = {
  name: "",
  phone: "",
  email: "",
  storeName: "",
  bio: "",
  address: "",
  deliveryFullName: "",
  deliveryPhone: "",
  addressIsDefault: true,
  addressLabel: "home",
  username: "",
  password: "",
  confirmPassword: "",
};

/** Mirrors the app's signupmodal: intro + 4 numbered steps. */
export default function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SignupData>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onAddressChange = useCallback((address: string) => {
    setError(null);
    setData((prev) => ({ ...prev, address }));
  }, []);

  const {
    locating,
    locationError,
    setLocationError,
    mapPinFor,
    onUseCurrentLocation,
  } = useCurrentLocationLookup({
    onAddressChange,
    onLocateStart: () => setError(null),
  });

  const setField =
    (key: keyof SignupData) =>
    (value: string | boolean | AddressLabel) => {
      setError(null);
      setLocationError(null);
      setData((prev) => ({ ...prev, [key]: value }));
    };

  const goBack = () => {
    setError(null);
    setLocationError(null);
    if (step > 0) setStep((prev) => prev - 1);
    else router.back();
  };

  const validateStep = (current: number): string | null => {
    if (current === 1) {
      if (!data.name.trim() || !data.phone.trim() || !data.email.trim()) {
        return t("auth.signup.errors.missingNameEmail");
      }
      if (!EMAIL_PATTERN.test(data.email.trim())) {
        return t("auth.signup.errors.invalidEmail");
      }
    }
    if (current === 2 && !data.storeName.trim()) {
      return t("auth.signup.errors.missingStoreName");
    }
    if (current === 3) {
      if (!data.address.trim()) return t("auth.signup.errors.missingAddress");
      if (!data.deliveryFullName.trim()) {
        return t("auth.signup.errors.missingFullName");
      }
      if (!data.deliveryPhone.trim()) return t("auth.signup.errors.missingPhone");
    }
    if (current === 4) {
      if (
        !data.username.trim() ||
        !data.password ||
        !data.confirmPassword
      ) {
        return t("auth.signup.errors.missingCredentials");
      }
      if (data.password.length < 6) return t("auth.signup.errors.weakPassword");
      if (data.password !== data.confirmPassword) {
        return t("auth.signup.errors.passwordMismatch");
      }
    }
    return null;
  };

  const continueFrom = (current: number) => {
    const message = validateStep(current);
    if (message) {
      setError(message);
      setLocationError(null);
      return;
    }
    setError(null);
    setLocationError(null);
    // Prefill recipient name from step 1 when entering the address step.
    if (current === 2) {
      setData((prev) => ({
        ...prev,
        deliveryFullName: prev.deliveryFullName.trim()
          ? prev.deliveryFullName
          : prev.name.trim(),
        deliveryPhone: prev.deliveryPhone.trim()
          ? prev.deliveryPhone
          : prev.phone.trim(),
      }));
    }
    setStep(current + 1);
  };

  const mapPin = mapPinFor(data.address);
  const formAlert = error ?? locationError;

  const submit = async () => {
    const message = validateStep(4);
    if (message) {
      setError(message);
      return;
    }

    setSubmitting(true);
    setError(null);
    setLocationError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          storeName: data.storeName.trim() || undefined,
          bio: data.bio.trim() || undefined,
          username: data.username.trim(),
          password: data.password,
          address: data.address.trim(),
          addressFullName: data.deliveryFullName.trim(),
          addressLabel: data.addressLabel,
          addressIsDefault: data.addressIsDefault,
          phone: data.deliveryPhone.trim(),
          countryCode: "ID",
          countryDialCode: "+62",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? t("auth.registerError"));
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("auth.signup.back")}
          className="flex size-10 items-center justify-center rounded-lg text-laku-ink transition-colors hover:bg-laku-surface"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        {step === 0 ? (
          <LakuLogo variant="onLight" className="h-7 w-auto" />
        ) : (
          <span className="w-10" aria-hidden />
        )}
      </div>

      {step === 0 ? (
        <div className="rounded-2xl bg-white p-6 md:p-8">
          <h1 className="text-2xl font-bold text-laku-ink md:text-3xl">
            {t("auth.signup.title")}
          </h1>
          <p className="mt-2 text-sm/6 text-laku-muted">{t("auth.signup.subtitle")}</p>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-8 h-12 w-full rounded-xl bg-laku-blue text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            {t("auth.signup.ctaCreateAccount")}
          </button>

          <p className="mt-6 text-center text-sm text-laku-muted">
            <Link href="/login" className="font-semibold text-laku-blue hover:underline">
              {t("auth.signup.alreadyHaveAccount")}
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-laku-muted">
            {t("auth.signup.footerBefore")}
            <Link
              href="/policies"
              className="font-semibold text-laku-ink underline-offset-2 hover:underline"
            >
              {t("auth.signup.footerLink")}
            </Link>
            {t("auth.signup.footerAfter")}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 md:p-8">
          <h1 className="text-2xl font-bold text-laku-ink md:text-3xl">
            {t("auth.signup.title")}
          </h1>
          <p className="mt-2 text-sm/6 text-laku-muted">{t("auth.signup.subtitle")}</p>

          <StepIndicator current={step} label={t("auth.signup.stepAria", { step })} />

          <div key={step} className="laku-rise mt-2 space-y-4">
            {step === 1 ? (
              <>
                <AuthField
                  label={t("auth.signup.fullName")}
                  name="name"
                  autoComplete="name"
                  placeholder={t("auth.signup.fullNamePlaceholder")}
                  value={data.name}
                  onChange={setField("name")}
                />
                <AuthField
                  label={t("auth.signup.phone")}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t("auth.signup.phonePlaceholder")}
                  value={data.phone}
                  onChange={(value) => {
                    setError(null);
                    setLocationError(null);
                    setData((prev) => {
                      const copied =
                        !prev.deliveryPhone.trim() ||
                        prev.deliveryPhone.trim() === prev.phone.trim();
                      return {
                        ...prev,
                        phone: value,
                        deliveryPhone: copied ? value : prev.deliveryPhone,
                      };
                    });
                  }}
                />
                <AuthField
                  label={t("auth.signup.email")}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.signup.emailPlaceholder")}
                  value={data.email}
                  onChange={setField("email")}
                />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <AuthField
                  label={t("auth.signup.storeName")}
                  name="storeName"
                  autoComplete="organization"
                  placeholder={t("auth.signup.storeNamePlaceholder")}
                  value={data.storeName}
                  onChange={setField("storeName")}
                />
                <AuthField
                  label={t("auth.signup.bioOptional")}
                  name="bio"
                  required={false}
                  multiline
                  rows={4}
                  placeholder={t("auth.signup.bioPlaceholder")}
                  value={data.bio}
                  onChange={setField("bio")}
                />
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="text-sm font-bold text-laku-ink">
                  {t("auth.signup.shippingAddress")}
                </h2>

                <AddressMapPreview
                  address={data.address}
                  savedCoordinates={mapPin.savedCoordinates}
                  savedPrecision={mapPin.savedPrecision}
                />

                <p className="text-xs font-semibold text-laku-muted">
                  {t("location.locationDetails")}
                </p>
                <UseCurrentLocationButton
                  onLocateAction={() => void onUseCurrentLocation()}
                  locating={locating}
                />
                <AuthField
                  label={t("auth.signup.deliveryAddress")}
                  name="address"
                  autoComplete="street-address"
                  multiline
                  rows={3}
                  placeholder={t("auth.signup.deliveryAddressPlaceholder")}
                  value={data.address}
                  onChange={setField("address")}
                />
                <AuthField
                  label={t("auth.signup.recipientName")}
                  name="deliveryFullName"
                  autoComplete="name"
                  placeholder={t("auth.signup.recipientNamePlaceholder")}
                  value={data.deliveryFullName}
                  onChange={setField("deliveryFullName")}
                />
                <AuthField
                  label={t("auth.signup.deliveryPhone")}
                  name="deliveryPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t("auth.signup.deliveryPhonePlaceholder")}
                  hint={t("auth.signup.deliveryPhoneHint")}
                  value={data.deliveryPhone}
                  onChange={setField("deliveryPhone")}
                />

                <div className="rounded-xl bg-laku-surface p-3">
                  <label className="flex items-center justify-between gap-3 text-sm text-laku-ink">
                    <span>{t("auth.signup.setDefault")}</span>
                    <input
                      type="checkbox"
                      checked={data.addressIsDefault}
                      onChange={(event) =>
                        setField("addressIsDefault")(event.target.checked)
                      }
                      className="size-4 accent-laku-blue"
                    />
                  </label>

                  <p className="mt-3 mb-2 text-sm text-laku-ink">
                    {t("auth.signup.labelAs")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {ADDRESS_LABELS.map((label) => {
                      const active = data.addressLabel === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setField("addressLabel")(label)}
                          className={`rounded-lg border px-2 py-2.5 text-sm font-semibold transition-colors ${
                            active
                              ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
                              : "border-laku-line bg-white text-laku-ink hover:border-laku-blue"
                          }`}
                        >
                          {t(`auth.signup.labels.${label}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <AuthField
                  label={t("auth.signup.username")}
                  name="username"
                  autoComplete="username"
                  placeholder={t("auth.signup.usernamePlaceholder")}
                  value={data.username}
                  onChange={setField("username")}
                />
                <AuthField
                  label={t("auth.signup.password")}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.signup.passwordPlaceholder")}
                  value={data.password}
                  onChange={setField("password")}
                />
                <AuthField
                  label={t("auth.signup.confirmPassword")}
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.signup.confirmPasswordPlaceholder")}
                  value={data.confirmPassword}
                  onChange={setField("confirmPassword")}
                />
              </>
            ) : null}
          </div>

          {formAlert ? (
            <p role="alert" className="mt-4 text-sm font-medium text-laku-alert">
              {formAlert}
            </p>
          ) : null}

          <button
            type="button"
            disabled={submitting}
            onClick={() => (step === 4 ? void submit() : continueFrom(step))}
            className="mt-6 h-12 w-full rounded-xl bg-laku-blue text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60"
          >
            {step === 4
              ? submitting
                ? t("auth.signup.creating")
                : t("auth.signup.ctaCreateAccount")
              : t("auth.signup.continue")}
          </button>

          {/* Phone OTP signup — temporarily disabled (parity with mobile app).
          {step === 4 ? (
            <button
              type="button"
              disabled
              className="mt-3 h-12 w-full rounded-xl border border-laku-line text-sm font-semibold text-laku-ink opacity-60"
            >
              Add phone number (OTP)
            </button>
          ) : null}
          */}

          {/* Google / social signup — temporarily disabled (parity with mobile app).
          <button
            type="button"
            disabled
            className="mt-3 h-12 w-full rounded-xl border border-laku-line text-sm font-semibold text-laku-ink opacity-60"
          >
            Continue with Google
          </button>
          */}
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current, label }: { current: number; label: string }) {
  return (
    <div
      aria-label={label}
      className="my-8 flex items-center justify-center gap-1"
    >
      {[1, 2, 3, 4].map((step) => {
        const done = current > step;
        const active = current === step;

        return (
          <div key={step} className="flex items-center">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${
                done
                  ? "bg-laku-ship text-white"
                  : active
                    ? "bg-laku-blue text-white"
                    : "bg-[#e5e7eb] text-laku-muted"
              }`}
            >
              {done ? <Check className="size-4" aria-hidden /> : step}
            </span>
            {step < 4 ? (
              <span
                className={`mx-1 h-0.5 w-5 ${
                  current > step ? "bg-laku-ship" : "bg-[#e5e7eb]"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
