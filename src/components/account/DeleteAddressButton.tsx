"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteAddressAction } from "@/app/actions/addresses";
import { useTranslations } from "@/i18n/client";

export default function DeleteAddressButton({ addressId }: { addressId: number }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("addresses.delete")}
      onClick={() => {
        if (!window.confirm(t("addresses.deleteConfirm"))) return;
        startTransition(async () => {
          await deleteAddressAction(addressId);
          router.refresh();
        });
      }}
      className="rounded-lg p-2 text-laku-muted transition-colors hover:bg-laku-alert/10 hover:text-laku-alert disabled:opacity-50"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}
