"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { saveAddressAction } from "@/app/actions/addresses";
import AddressMapPreview from "@/components/auth/AddressMapPreview";
import AuthField from "@/components/auth/AuthField";
import { useTranslations } from "@/i18n/client";
import type { MarketplaceAddress } from "@/lib/api/addresses";

const LABELS = ["home", "work", "store"] as const;

const INITIAL = { ok: false as const, error: undefined as string | undefined };

export default function AddressForm({
  address,
}: {
  address?: MarketplaceAddress | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveAddressAction, INITIAL);
  const [form, setForm] = useState({
    fullName: address?.fullName ?? "",
    phone: address?.phone ?? "",
    addressText: address?.address ?? "",
    label: (address?.label as (typeof LABELS)[number]) || "home",
    isDefault: address?.isDefault ?? false,
  });

  useEffect(() => {
    if (state.ok) {
      router.push("/account/addresses");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl bg-white p-6">
      {address ? (
        <input type="hidden" name="addressId" value={address.id} />
      ) : null}
      <input type="hidden" name="label" value={form.label} />
      <input
        type="hidden"
        name="isDefault"
        value={form.isDefault ? "true" : "false"}
      />

      <AddressMapPreview address={form.addressText} />

      <AuthField
        label={t("addresses.fields.fullName")}
        name="fullName"
        value={form.fullName}
        onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
        autoComplete="name"
      />
      <AuthField
        label={t("addresses.fields.phone")}
        name="phone"
        value={form.phone}
        onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
        autoComplete="tel"
        inputMode="tel"
      />
      <AuthField
        label={t("addresses.fields.address")}
        name="address"
        value={form.addressText}
        onChange={(value) =>
          setForm((prev) => ({ ...prev, addressText: value }))
        }
        multiline
        rows={3}
        autoComplete="street-address"
      />

      <div>
        <p className="mb-2 text-sm font-semibold text-laku-ink">
          {t("addresses.fields.label")}
        </p>
        <div className="flex flex-wrap gap-2">
          {LABELS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, label }))}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                form.label === label
                  ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
                  : "border-laku-line text-laku-ink hover:bg-laku-surface"
              }`}
            >
              {t(`addresses.labels.${label}`)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-laku-ink">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, isDefault: event.target.checked }))
          }
          className="size-4 rounded border-laku-line text-laku-blue"
        />
        {t("addresses.fields.isDefault")}
      </label>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-laku-alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60"
        >
          {pending ? t("common.processing") : t("common.save")}
        </button>
        <Link
          href="/account/addresses"
          className="rounded-lg border border-laku-line px-5 py-3 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
        >
          {t("common.cancel")}
        </Link>
      </div>
    </form>
  );
}
