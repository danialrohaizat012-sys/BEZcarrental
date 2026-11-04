"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { findCustomer, vehicleStateAt } from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import { intlLocale } from "@/lib/i18n";
import { addDaysLocal, fromLocal, TIME_ZONE, todayLocal } from "@/lib/time";
import { categories } from "@/lib/data/catalog";
import { Button } from "../ui/button";
import { IconChevron, IconChevronLeft } from "../ui/icons";
import { useAdminCtx } from "./context";
import { fmtRange } from "./format";
import { PageHeader } from "./ui";

const DAY_W = 64; // px per day column
const SPANS = [7, 14, 28] as const;

export function FleetCalendar() {
  const s = useAdmin()!;
  const { t, lang } = useAdminCtx();
  const today = todayLocal();
  const [start, setStart] = useState(addDaysLocal(today, -1));
  const [span, setSpan] = useState<(typeof SPANS)[number]>(14);
  const winStart = fromLocal(`${start}T00:00`).getTime();
  const winEnd = winStart + span * 86400_000;
  const days = Array.from({ length: span }, (_, i) => addDaysLocal(start, i));
  const base = `/${lang}/admin`;
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => {
    const order = Object.fromEntries(categories.map((c) => [c.id, c.sort]));
    return [...s.vehicles].sort((a, b) => order[a.categoryId] - order[b.categoryId] || a.model.localeCompare(b.model)).map((v) => {
      const items = [
        ...s.bookings.filter((b) => b.vehicleId === v.id && ["pending", "confirmed", "collected", "active", "returned"].includes(b.status)).map((b) => ({
          id: b.id, kind: b.status === "pending" ? "pending" : b.status === "confirmed" ? "confirmed" : "onRoad",
          start: fromLocal(b.pickup).getTime(), end: fromLocal(b.return).getTime(),
          label: `${b.ref} · ${findCustomer(s, b.customerId)?.fullName ?? ""}`, title: `${b.ref} — ${t.status[b.status]} — ${fmtRange(b.pickup, b.return, lang)}`, href: `${base}/bookings/${b.id}`,
        })),
        ...s.maintenance.filter((m) => m.vehicleId === v.id && m.status === "open").map((m) => ({
          id: m.id, kind: "maintenance", start: fromLocal(m.start).getTime(), end: m.end ? fromLocal(m.end).getTime() : Infinity,
          label: t.fleet.mntTypes[m.type], title: `${t.fleet.mntTypes[m.type]} — ${m.description}`, href: `${base}/fleet/${v.id}`,
        })),
      ].filter((x) => x.start < winEnd && x.end > winStart);
      return { v, state: vehicleStateAt(s, v, new Date()), items };
    });
  }, [s, winStart, winEnd, base, lang, t]);

  const availableToday = rows.filter((r) => r.state === "available").length;
  const pos = (a: number, b: number) => {
    const l = Math.max(a, winStart), r = Math.min(b, winEnd);
    return { left: ((l - winStart) / 86400_000) * DAY_W, width: Math.max(10, ((r - l) / 86400_000) * DAY_W - 2) };
  };
  const style: Record<string, string> = {
    pending: "top-[34px] h-[18px] border border-dashed border-warn bg-warn-soft/80 text-warn",
    confirmed: "top-1.5 h-[26px] bg-petrol text-ivory",
    onRoad: "top-1.5 h-[26px] bg-ink text-ivory",
    maintenance: "top-1.5 h-[26px] bg-[repeating-linear-gradient(135deg,#d8d2c6_0_6px,#ebe6dc_6px_12px)] text-steel",
  };
  const dayFmt = new Intl.DateTimeFormat(intlLocale(lang), { weekday: "short", timeZone: "UTC" });
  const nowLeft = ((now - winStart) / 86400_000) * DAY_W;

  return (
    <>
      <PageHeader title={t.calendar.title} subtitle={<>{t.calendar.subtitle} <span className="font-semibold text-good">{t.calendar.freeToday(availableToday)}</span></>}
        actions={
          <>
            <div className="flex rounded-xl border border-line bg-paper p-0.5">
              {SPANS.map((n) => <button key={n} type="button" onClick={() => setSpan(n)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${span === n ? "bg-ink text-ivory" : "text-steel"}`}>{n} {t.calendar.days}</button>)}
            </div>
            <Button size="sm" variant="secondary" onClick={() => setStart(addDaysLocal(start, -Math.ceil(span / 2)))} aria-label={t.calendar.prev}><IconChevronLeft className="size-4" /></Button>
            <Button size="sm" variant="secondary" onClick={() => setStart(addDaysLocal(today, -1))}>{t.calendar.today}</Button>
            <Button size="sm" variant="secondary" onClick={() => setStart(addDaysLocal(start, Math.ceil(span / 2)))} aria-label={t.calendar.next}><IconChevron className="size-4" /></Button>
          </>
        } />

      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-steel">
        <li className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-petrol" />{t.calendar.legend.confirmed}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-ink" />{t.calendar.legend.onRoad}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-5 rounded border border-dashed border-warn bg-warn-soft" />{t.calendar.legend.pending}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-[repeating-linear-gradient(135deg,#d8d2c6_0_3px,#ebe6dc_3px_6px)]" />{t.calendar.legend.maintenance}</li>
      </ul>

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <div style={{ width: 200 + span * DAY_W }} className="min-w-full">
          <div className="sticky top-0 z-10 flex border-b border-line bg-ivory/80 text-xs">
            <div className="sticky left-0 z-20 w-[200px] shrink-0 border-r border-line bg-ivory px-4 py-2 font-semibold text-mist">{t.bookings.vehicle}</div>
            {days.map((d) => (
              <div key={d} style={{ width: DAY_W }} className={`shrink-0 border-r border-line/60 py-1.5 text-center ${d === today ? "bg-petrol-soft font-bold text-petrol" : "text-steel"}`}>
                <div className="text-[10px] uppercase">{dayFmt.format(new Date(`${d}T12:00:00Z`))}</div><div className="tabular-nums">{Number(d.slice(8))}</div>
              </div>
            ))}
          </div>
          {rows.map(({ v, state, items }) => (
            <div key={v.id} className={`flex border-b border-line last:border-0 ${v.status !== "active" ? "opacity-50" : ""}`}>
              <Link href={`${base}/fleet/${v.id}`} className="sticky left-0 z-10 w-[200px] shrink-0 border-r border-line bg-paper px-4 py-2 hover:bg-ivory">
                <p className="truncate text-sm font-semibold">{v.make} {v.model}</p>
                <p className="flex items-center gap-1.5 text-xs text-mist">
                  <span className={`size-1.5 rounded-full ${state === "available" ? "bg-good" : state === "on_rent" ? "bg-ink" : state === "maintenance" ? "bg-amber" : "bg-mist"}`} />
                  {v.plateNo} · {t.vehicleState[state]}
                </p>
              </Link>
              <div className="relative h-[58px] shrink-0" style={{ width: span * DAY_W, backgroundImage: `repeating-linear-gradient(90deg, transparent 0 ${DAY_W - 1}px, #ece8df ${DAY_W - 1}px ${DAY_W}px)` }}>
                {nowLeft > 0 && nowLeft < span * DAY_W && <div className="absolute inset-y-0 w-px bg-bad/60" style={{ left: nowLeft }} aria-hidden />}
                {items.map((it) => {
                  const p = pos(it.start, it.end);
                  return (
                    <Link key={it.id} href={it.href} title={it.title} style={{ left: p.left + 1, width: p.width }}
                      className={`absolute truncate rounded-md px-1.5 text-[11px] font-semibold leading-[18px] transition-[filter] hover:brightness-110 ${style[it.kind]} ${it.kind !== "pending" ? "leading-[26px]" : ""}`}>
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-mist">{lang === "ms" ? "Waktu Malaysia (MYT). Klik bar untuk membuka tempahan." : "Malaysia time (MYT). Click a bar to open the booking."}</p>
      <span className="sr-only">{TIME_ZONE}</span>
    </>
  );
}
