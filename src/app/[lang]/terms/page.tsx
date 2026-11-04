import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).legal.termsTitle } : {};
}

export default async function Page({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang).legal;
  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">{t.termsTitle}</h1>
      <p className="mt-3 rounded-xl border border-dashed border-amber/50 bg-amber-soft/50 px-4 py-3 text-sm text-amber-2">{t.placeholder}</p>
      <ol className="mt-8 list-decimal space-y-4 pl-5 leading-relaxed text-steel marker:font-semibold marker:text-ink">
        {t.terms.map((p) => <li key={p}>{p}</li>)}
      </ol>
    </article>
  );
}
