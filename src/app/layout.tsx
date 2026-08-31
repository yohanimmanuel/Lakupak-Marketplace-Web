import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import MobileTabBar from "@/components/layout/MobileTabBar";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { I18nProvider } from "@/i18n/client";
import { getDictionary, getLocale, getTranslations } from "@/i18n/server";
import { getCart } from "@/lib/api/cart";
import { getSession } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("meta.siteTitle"),
      template: "%s | Lakupak B2B Marketplace",
    },
    description: t("meta.siteDescription"),
    openGraph: {
      type: "website",
      siteName: "Lakupak B2B Marketplace",
      locale: t.locale === "en" ? "en_US" : "id_ID",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  const dictionary = getDictionary(locale);
  const cartItems = session
    ? await getCart({ userId: session.user.id, token: session.token })
    : [];
  const cartCount = cartItems.length;

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <I18nProvider dictionary={dictionary} locale={locale}>
          <SiteHeader user={session?.user ?? null} cartCount={cartCount} />
          <main className="min-h-[60vh] bg-laku-surface">{children}</main>
          <SiteFooter />
          {/* Bottom tab bar overlays content on phones, so reserve space for it. */}
          <div className="h-16 sm:hidden" aria-hidden />
          <MobileTabBar cartCount={cartCount} />
        </I18nProvider>
      </body>
    </html>
  );
}
