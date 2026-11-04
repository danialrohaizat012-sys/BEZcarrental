import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Badge, SampleTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconBag, IconCalendar, IconCheck, IconChevronLeft, IconFuel, IconGear, IconInfo, IconSeat } from "@/components/ui/icons";
import { AvailabilityCalendar } from "@/components/vehicle/availability-calendar";
import { Gallery } from "@/components/vehicle/gallery";
import { getBookingRules, getBusyRanges, getCategory, getVehicleBySlug, isVehicleAvailable, quoteContext } from "@/lib/data/repository";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { formatRM } from "@/lib/money";
import { calculateQuote, validatePeriod } from "@/lib/pricing";
import { formatDateTime, fromLocal } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/[lang]/vehicles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const v = getVehicleBySlug(slug);
  return v ? { title: `${v.make} ${v.model}` } : {};
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function VehiclePage({ params, searchParams }: PageProps<"/[lang]/vehicles/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();
  await connection();
  const sp = await searchParams;
  const t = getDictionary(lang);
  const rules = getBookingRules();
  const category = getCategory(vehicle.categoryId)!;

  const pickup = one(sp.pickup), ret = one(sp.return);
  const validPeriod = Boolean(pickup && ret) && !validatePeriod(pickup, ret, rules);
  const available = validPeriod ? isVehicleAvailable(vehicle.id, fromLocal(pickup), fromLocal(ret)) : undefined;
  const quote = validPeriod ? calculateQuote(vehicle, pickup, ret, [], "office", quoteContext(vehicle)) : null;

  const bookQs = new URLSearchParams({ vehicle: vehicle.slug });
  if (validPeriod) { bookQs.set("pickup", pickup); bookQs.set("return", ret); }
  const bookHref = `/${lang}/book?${bookQs}`;
  const name = `${vehicle.make} ${vehicle.model}`;

  const specs = [
    { icon: IconGear, label: t.vehicle.transmission, value: vehicle.transmission === "auto" ? t.common.auto : t.common.manual },
    { icon: IconSeat, label: t.vehicle.seats, value: String(vehicle.seats) },
    { icon: IconBag, label: t.vehicle.luggage, value: `${vehicle.luggage} ${t.common.bags}` },
    { icon: IconFuel, label: t.vehicle.fuel, value: t.common[vehicle.fuel] },
  ];
  const rateRows = [
    { label: t.vehicle.daily, sen: vehicle.rates.daily },
    { label: t.vehicle.weekly, sen: vehicle.rates.weekly },
    { label: t.vehicle.monthly, sen: vehicle.rates.monthly },
    { label: t.vehicle.hourly, sen: vehicle.rates.hourly },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-20">
      <Link href={`/${lang}/vehicles${validPeriod ? `?${new URLSearchParams({ pickup, return: ret })}` : ""}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-steel hover:text-ink">
        <IconChevronLeft className="size-4" />{t.catalogue.title}
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-petrol">{category.name[lang]}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
          <p className="mt-1 text-steel">{vehicle.variant} · {vehicle.year} · {vehicle.engine}</p>

          <div className="mt-6">
            <Gallery vehicle={vehicle} lang={lang} caption={t.common.representative} />
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specs.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-line bg-paper p-4">
                <Icon className="size-5 text-petrol" />
                <dt className="mt-3 text-xs font-medium text-mist">{label}</dt>
                <dd className="font-display font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-10">
            <h2 className="font-display text-xl font-bold">{t.vehicle.features}</h2>
            <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {vehicle.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[15px]"><IconCheck className="size-4 shrink-0 text-good" />{t.features[f] ?? f}</li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold">{t.vehicle.rates}</h2>
              <SampleTag>{t.common.sample}</SampleTag>
            </div>
            <p className="mt-1 text-sm text-mist">{t.vehicle.ratesNote}</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper">
              <table className="w-full text-[15px]">
                <tbody className="divide-y divide-line">
                  {rateRows.map((r) => (
                    <tr key={r.label}>
                      <th scope="row" className="px-4 py-3 text-left font-normal text-steel">{r.label}</th>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRM(r.sen, lang)}</td>
                    </tr>
                  ))}
                  <tr className="bg-sand/40">
                    <th scope="row" className="px-4 py-3 text-left font-normal text-steel">{t.vehicle.deposit}</th>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRM(category.depositSen, lang)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-bold">{t.vehicle.conditions}</h2>
            <p className="mt-1 text-sm text-mist">{t.vehicle.conditionsNote}</p>
            <ul className="mt-4 space-y-2.5">
              {t.vehicle.conditionsList.map((c) => (
                <li key={c} className="flex gap-2.5 text-[15px] text-steel"><IconInfo className="mt-0.5 size-4 shrink-0 text-petrol" />{c}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-line bg-paper p-6 shadow-card">
            <p className="text-sm text-mist">{t.common.from}</p>
            <p className="font-display text-3xl font-bold tabular-nums">
              {formatRM(vehicle.rates.daily, lang)}<span className="text-base font-medium text-steel">{t.common.perDay}</span>
            </p>
            {validPeriod ? (
              <div className="mt-5 space-y-3 rounded-2xl bg-ivory p-4 text-sm">
                <p className="flex items-start gap-2"><IconCalendar className="mt-0.5 size-4 shrink-0 text-petrol" />
                  <span>{formatDateTime(pickup, lang)}<br />→ {formatDateTime(ret, lang)}</span></p>
                {available ? <Badge tone="good">{t.common.available}</Badge> : <Badge tone="bad">{t.catalogue.notAvailable}</Badge>}
                {quote && available && (
                  <p className="flex items-baseline justify-between border-t border-line pt-3">
                    <span className="text-steel">{t.booking.estimate}</span>
                    <span className="font-display text-lg font-bold tabular-nums">{formatRM(quote.totalSen, lang)}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-steel">{t.common.checkDates}</p>
            )}
            <ButtonLink href={bookHref} size="lg" className="mt-5 w-full">{t.common.bookThis}</ButtonLink>
          </div>

          <div className="rounded-3xl border border-line bg-paper p-6">
            <h2 className="font-display text-lg font-bold">{t.vehicle.availability}</h2>
            <p className="mb-4 text-xs text-mist">{t.vehicle.availabilityNote}</p>
            <AvailabilityCalendar busy={getBusyRanges(vehicle.id)} lang={lang} openHour={rules.openHour} closeHour={rules.closeHour}
              bookBase={`/${lang}/book?vehicle=${vehicle.slug}`} />
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div data-sticky-cta className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 ">
          <div>
            <p className="font-display text-lg font-bold tabular-nums leading-tight">
              {formatRM(quote && available ? quote.totalSen : vehicle.rates.daily, lang)}
              {!(quote && available) && <span className="text-sm font-medium text-steel">{t.common.perDay}</span>}
            </p>
            <p className="text-xs text-mist">{name}</p>
          </div>
          <ButtonLink href={bookHref}>{t.common.bookThis}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
