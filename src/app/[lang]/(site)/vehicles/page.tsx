import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SearchForm } from "@/components/search/search-form";
import { buttonClass } from "@/components/ui/button";
import { IconAlert, IconCalendar } from "@/components/ui/icons";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { getBookingRules, getCategories, getVehicles, isVehicleAvailable, quoteContext } from "@/lib/data/repository";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { calculateQuote, validatePeriod } from "@/lib/pricing";
import { defaultPeriod, formatDateTime, fromLocal } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/[lang]/vehicles">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).catalogue.title } : {};
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function VehiclesPage({ params, searchParams }: PageProps<"/[lang]/vehicles">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await connection();
  const sp = await searchParams;
  const t = getDictionary(lang);
  const rules = getBookingRules();
  const categories = getCategories();

  const pickup = one(sp.pickup), ret = one(sp.return);
  const category = categories.some((c) => c.id === one(sp.category)) ? one(sp.category) : "";
  const hasPeriod = Boolean(pickup && ret);
  const periodError = hasPeriod ? validatePeriod(pickup, ret, rules) : null;
  const usePeriod = hasPeriod && !periodError;

  const rows = getVehicles()
    .filter((v) => !category || v.categoryId === category)
    .map((v) => {
      if (!usePeriod) return { v, available: undefined, total: undefined };
      const available = isVehicleAvailable(v.id, fromLocal(pickup), fromLocal(ret));
      const total = calculateQuote(v, pickup, ret, [], "office", quoteContext(v)).totalSen;
      return { v, available, total };
    })
    .sort((a, b) => Number(b.available ?? 1) - Number(a.available ?? 1) || a.v.rates.daily - b.v.rates.daily);

  const defaults = usePeriod ? { pickup, return: ret, category } : { ...defaultPeriod(), category };
  const baseQs = (cat: string) => {
    const q = new URLSearchParams();
    if (usePeriod) { q.set("pickup", pickup); q.set("return", ret); }
    if (cat) q.set("category", cat);
    const s = q.toString();
    return `/${lang}/vehicles${s ? `?${s}` : ""}`;
  };
  const periodQs = usePeriod ? new URLSearchParams({ pickup, return: ret }).toString() : "";
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${active ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-steel hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.catalogue.title}</h1>
      <p className="mt-2 max-w-2xl text-steel">{t.catalogue.subtitle}</p>

      <div className="mt-6">
        <SearchForm key={`${pickup}${ret}${category}`} lang={lang} variant="bar" defaults={defaults}
          categories={categories.map((c) => ({ id: c.id, name: c.name[lang] }))} openHour={rules.openHour} closeHour={rules.closeHour} />
      </div>

      {periodError && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
          <IconAlert className="size-4 shrink-0" />{t.booking.errors[periodError]}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={t.search.category}>
          <Link href={baseQs("")} className={chip(!category)} aria-current={!category ? "page" : undefined}>{t.search.allCategories}</Link>
          {categories.map((c) => (
            <Link key={c.id} href={baseQs(c.id)} className={chip(category === c.id)} aria-current={category === c.id ? "page" : undefined}>{c.name[lang]}</Link>
          ))}
        </nav>
        <p className="flex items-center gap-2 text-sm text-steel">
          {usePeriod ? (
            <>
              <IconCalendar className="size-4" />
              <span>{t.catalogue.availableFor} <strong className="font-semibold text-ink">{formatDateTime(pickup, lang)} → {formatDateTime(ret, lang)}</strong></span>
            </>
          ) : (
            <span>{t.catalogue.results(rows.length)} · {t.common.checkDates}</span>
          )}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-paper px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">{t.catalogue.empty}</p>
          <p className="mt-1 text-steel">{t.catalogue.emptyHint}</p>
          <Link href={`/${lang}/vehicles`} className={buttonClass("secondary", "md", "mt-6")}>{t.catalogue.clear}</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ v, available, total }) => (
            <VehicleCard key={v.id} vehicle={v} lang={lang} available={available} totalSen={total} query={periodQs} />
          ))}
        </div>
      )}
    </div>
  );
}
