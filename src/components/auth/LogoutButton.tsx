"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { useTranslations } from "@/i18n/client";

export default function LogoutButton() {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:border-laku-alert hover:text-laku-alert disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden />
      {t("nav.logout")}
    </button>
  );
}
