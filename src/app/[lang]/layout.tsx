import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
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
        {children}
      </body>
    </html>
  );
}
