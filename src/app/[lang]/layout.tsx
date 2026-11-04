import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { getDictionary, hasLocale, locales } from "@/lib/i18n";
import "../globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const generateStaticParams = () => locales.map((lang) => ({ lang }));

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: { default: t.meta.title, template: `%s · BEZ Car Rental (demo)` },
    description: t.meta.description,
    robots: { index: false, follow: false },
    alternates: { languages: { ms: "/ms", en: "/en" } },
  };
}

export const viewport: Viewport = { themeColor: "#f6f4ef" };

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang === "ms" ? "ms-MY" : "en-MY"} className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-paper focus:px-4 focus:py-2">Skip</a>
        <Suspense fallback={<div className="h-[88px]" />}>
          <Header lang={lang} />
        </Suspense>
        <main id="main" className="flex-1">{children}</main>
        <Footer lang={lang} />
        <WhatsAppFab lang={lang} />
      </body>
    </html>
  );
}
