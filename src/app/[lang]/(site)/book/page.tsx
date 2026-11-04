import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getAddOns, getBookingRules, getCategories, getLocations, getSeasonalRules, getVehicles } from "@/lib/data/repository";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { defaultPeriod, isLocalDateTime } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/[lang]/book">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).booking.title } : {};
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BookPage({ params, searchParams }: PageProps<"/[lang]/book">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await connection();
  const sp = await searchParams;
  const t = getDictionary(lang);
  const def = defaultPeriod();
  const pickup = isLocalDateTime(one(sp.pickup)) ? one(sp.pickup) : def.pickup;
  const ret = isLocalDateTime(one(sp.return)) ? one(sp.return) : def.return;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.booking.title}</h1>
      <BookingFlow
        lang={lang}
        vehicles={getVehicles()}
        categories={getCategories()}
        addOns={getAddOns()}
        locations={getLocations()}
        seasonalRules={getSeasonalRules()}
        rules={getBookingRules()}
        initial={{ slug: one(sp.vehicle), pickup, return: ret }}
      />
    </div>
  );
}
