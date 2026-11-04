import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site/header";
import { demoCredentials } from "@/lib/admin/auth";
import { hasLocale } from "@/lib/i18n";
import { getAdminDictionary } from "@/lib/i18n/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function LoginPage({ params }: PageProps<"/[lang]/admin/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getAdminDictionary(lang).login;
  // Demo only: credentials are displayed so presenters can sign in. Remove when real auth is added.
  const showDemo = process.env.ADMIN_SHOW_DEMO_CREDENTIALS !== "false";
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo light /></div>
        <div className="rounded-3xl bg-paper p-6 shadow-lift sm:p-8">
          <h1 className="font-display text-2xl font-bold">{t.title}</h1>
          <p className="mb-6 mt-1 text-sm text-steel">{t.subtitle}</p>
          <LoginForm lang={lang} demo={showDemo ? demoCredentials : { email: "", password: "••••••" }} />
        </div>
        <p className="mt-6 text-center text-sm"><Link href={`/${lang}`} className="text-ivory/60 hover:text-ivory">← {t.back}</Link></p>
      </div>
    </div>
  );
}
