"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DemoBooking } from "@/lib/booking/schema";
import { loadBooking } from "@/lib/booking/storage";
import type { AddOn, Location, SeasonalRule } from "@/lib/data/types";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/time";
import { whatsappLink } from "@/lib/whatsapp";
import { Badge } from "../ui/badge";
import { buttonClass } from "../ui/button";
import { IconClock, IconInfo, IconWhatsApp } from "../ui/icons";
import { PriceBreakdown } from "./price-breakdown";

export function ConfirmationView({ refCode, lang, addOns, locations, seasonalRules }: {
  refCode: string; lang: Locale; addOns: AddOn[]; locations: Location[]; seasonalRules: SeasonalRule[];
}) {
  const t = getDictionary(lang);
  const c = t.confirmation;
  const [booking, setBooking] = useState<DemoBooking | null | undefined>(undefined);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
  useEffect(() => setBooking(loadBooking(refCode)), [refCode]);

  if (booking === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label={t.common.loading} />;
  if (booking === null) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">{c.notFound}</p>
        <p className="mt-1 font-mono text-sm text-steel">{refCode}</p>
        <Link href={`/${lang}/vehicles`} className={buttonClass("primary", "md", "mt-6")}>{c.another}</Link>
      </div>
    );
  }
  const loc = locations.find((l) => l.id === booking.locationId);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-warn-soft text-warn"><IconClock /></span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">{c.title}</h1>
          <p className="mt-2 text-steel">{c.subtitle}</p>
          <div className="mt-6 grid gap-4 rounded-2xl bg-ivory p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist">{c.reference}</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider">{booking.ref}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist">{c.status}</p>
              <p className="mt-2"><Badge tone="warn">{c.pending}</Badge></p>
            </div>
          </div>
          <p className="mt-4 flex gap-2 text-sm text-steel"><IconInfo className="mt-0.5 size-4 shrink-0 text-warn" />{c.pendingNote}</p>

          <dl className="mt-6 divide-y divide-line border-t border-line text-[15px]">
            {[
              [t.booking.vehicle, `${booking.vehicle.make} ${booking.vehicle.model} ${booking.vehicle.variant}`],
              [t.booking.pickup, formatDateTime(booking.pickup, lang)],
              [t.booking.return, formatDateTime(booking.return, lang)],
              [t.booking.location, loc?.name[lang] ?? ""],
              [c.customer, [booking.customer.fullName, booking.customer.phone, booking.customer.email].filter(Boolean).join(" · ")],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="text-steel">{k}</dt><dd className="font-medium sm:text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold">{c.whatsNext}</h2>
          <ol className="mt-4 space-y-3">
            {c.next.map((s, i) => (
              <li key={s} className="flex gap-3 text-[15px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-petrol-soft text-xs font-bold text-petrol">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={whatsappLink(t.whatsapp.bookingMessage(booking.ref))} target="_blank" rel="noopener noreferrer"
              className={buttonClass("primary", "md", "bg-[#1f8f4e] hover:bg-[#1a7a43]")}><IconWhatsApp className="size-5" />{c.whatsapp}</a>
            <Link href={`/${lang}/vehicles`} className={buttonClass("secondary", "md")}>{c.another}</Link>
          </div>
        </div>
        <p className="rounded-xl border border-dashed border-amber/50 bg-amber-soft/50 px-4 py-3 text-sm text-amber-2">{c.demoNote}</p>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PriceBreakdown quote={booking.quote} lang={lang} addOns={addOns} locations={locations} seasonalRules={seasonalRules} locationId={booking.locationId} />
      </aside>
    </div>
  );
}
