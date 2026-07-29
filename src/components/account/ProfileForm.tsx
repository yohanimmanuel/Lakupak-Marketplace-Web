"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Camera, CheckCircle2, ChevronRight, MapPin, UserRound } from "lucide-react";

import { updateProfileAction } from "@/app/actions/profile";
import { useTranslations } from "@/i18n/client";

type ProfileFields = {
  username: string;
  name: string;
  storeName: string;
  email: string;
  phone: string;
  bio: string;
  chosenAddress: string;
  country: string;
  image: string;
};

const INITIAL = { ok: false } as const;

export default function ProfileForm({ profile }: { profile: ProfileFields }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(updateProfileAction, INITIAL);
  const [image, setImage] = useState(profile.image);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload/avatar", { method: "POST", body });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setUploadError(payload.error ?? t("profile.errors.upload"));
        return;
      }
      setImage(payload.url);
    } catch {
      setUploadError(t("profile.errors.upload"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="image" value={image} />

      <section className="rounded-2xl bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-laku-blue/10 text-laku-blue">
            {image ? (
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <UserRound className="size-8" aria-hidden />
            )}
          </span>

          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-laku-line px-4 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface disabled:opacity-60"
            >
              <Camera className="size-4" aria-hidden />
              {uploading ? t("profile.uploading") : t("profile.changePhoto")}
            </button>
            <p className="mt-1.5 text-xs text-laku-muted">{t("profile.photoHint")}</p>
            {uploadError ? (
              <p className="mt-1 text-xs font-medium text-laku-alert">{uploadError}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6">
        <h2 className="text-sm font-bold text-laku-ink">{t("profile.identity")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            name="username"
            label={t("profile.username")}
            defaultValue={profile.username}
            required
          />
          <Field name="name" label={t("profile.name")} defaultValue={profile.name} />
          <Field
            name="storeName"
            label={t("profile.storeName")}
            defaultValue={profile.storeName}
          />
          <Field
            name="country"
            label={t("profile.country")}
            defaultValue={profile.country}
          />
          <div className="sm:col-span-2">
            <label htmlFor="bio" className="mb-1.5 block text-xs font-semibold text-laku-muted">
              {t("profile.bio")}
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={profile.bio}
              placeholder={t("profile.bioPlaceholder")}
              className="w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none transition-colors focus:border-laku-blue"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6">
        <h2 className="text-sm font-bold text-laku-ink">{t("profile.contact")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            name="email"
            label={t("profile.email")}
            type="email"
            defaultValue={profile.email}
          />
          <Field
            name="phone"
            label={t("profile.phone")}
            type="tel"
            defaultValue={profile.phone}
          />
          <div className="sm:col-span-2">
            {/* Address is chosen in the address book, not edited as free text. */}
            <input type="hidden" name="chosenAddress" value={profile.chosenAddress} />
            <p className="mb-1.5 text-xs font-semibold text-laku-muted">
              {t("profile.mainAddress")}
            </p>
            <div className="rounded-lg border border-laku-line bg-laku-surface/60 px-3.5 py-3">
              <div className="flex gap-3">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-laku-blue"
                  aria-hidden
                />
                {profile.chosenAddress.trim() ? (
                  <p className="text-sm leading-relaxed text-laku-ink">
                    {profile.chosenAddress}
                  </p>
                ) : (
                  <p className="text-sm text-laku-muted">{t("profile.noAddress")}</p>
                )}
              </div>
            </div>
            <Link
              href="/account/addresses"
              className="mt-3 inline-flex w-full items-center justify-between gap-2 rounded-lg border border-laku-line bg-white px-4 py-3 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue sm:w-auto sm:min-w-56"
            >
              {t("profile.manageAddresses")}
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-lg bg-laku-discount-bg px-4 py-3 text-sm font-medium text-laku-discount-ink">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="flex items-center gap-2 rounded-lg bg-laku-ship/10 px-4 py-3 text-sm font-medium text-laku-buy">
          <CheckCircle2 className="size-4" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-full rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? t("profile.saving") : t("profile.save")}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-laku-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none transition-colors focus:border-laku-blue"
      />
    </div>
  );
}
