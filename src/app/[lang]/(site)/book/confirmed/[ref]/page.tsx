import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmationView } from "@/components/booking/confirmation-view";
import { getAddOns, getLocations, getSeasonalRules } from "@/lib/data/repository";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/book/confirmed/[ref]">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).confirmation.title } : {};
}

export default async function ConfirmedPage({ params }: PageProps<"/[lang]/book/confirmed/[ref]">) {
  const { lang, ref } = await params;
  if (!hasLocale(lang) || !/^BEZ-[A-Z0-9]{6}$/.test(ref)) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <ConfirmationView refCode={ref} lang={lang} addOns={getAddOns()} locations={getLocations()} seasonalRules={getSeasonalRules()} />
    </div>
  );
}
