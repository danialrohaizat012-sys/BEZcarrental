import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { getAdminSession } from "@/lib/admin/auth";
import { hasLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · BEZ (demo)" }, robots: { index: false, follow: false } };

async function Guarded({ lang, children }: { lang: string; children: React.ReactNode }) {
  if (!hasLocale(lang)) notFound();
  const session = await getAdminSession();
  if (!session) redirect(`/${lang}/admin/login`);
  return <AdminShell lang={lang} user={session.email}>{children}</AdminShell>;
}

export default async function ConsoleLayout({ children, params }: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f1ec]" />}>
      <Guarded lang={lang}>{children}</Guarded>
    </Suspense>
  );
}
