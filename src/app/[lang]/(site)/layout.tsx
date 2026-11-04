import { Suspense } from "react";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-paper focus:px-4 focus:py-2">Skip</a>
      <Suspense fallback={<div className="h-[88px]" />}>
        <Header lang={lang} />
      </Suspense>
      <main id="main" className="flex-1">{children}</main>
      <Footer lang={lang} />
      <WhatsAppFab lang={lang} />
    </>
  );
}
